import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "crypto";
import dbConnect from "@/lib/utils/dbConnet";
import OtpStore from "@/models/OtpStore";
import OtpSendLog from "@/models/OtpSendLog";
import { sendWhatsAppOtp } from "./whatsapp";

const OTP_TTL_SECONDS = 300; // 5 minutes
export const RESEND_COOLDOWN_SECONDS = 60;
const OTP_LENGTH = 6;
const MAX_VERIFY_ATTEMPTS = 3;

// Sends per rolling hour. The per-IP cap stops one client cycling through
// numbers (WhatsApp pumping); the per-number cap stops one inbox being spammed.
const MAX_SENDS_PER_PHONE_PER_HOUR = 5;
const MAX_SENDS_PER_IP_PER_HOUR = 20;

// Always WhatsApp unless OTP_PROVIDER=console is set explicitly, which logs
// the code to the server console instead (offline testing only — never in
// production).
function otpProvider(): "whatsapp" | "console" {
  if (
    process.env.OTP_PROVIDER === "console" &&
    process.env.NODE_ENV !== "production"
  ) {
    return "console";
  }
  return "whatsapp";
}

// Fixed codes for test numbers, from OTP_TEST_NUMBERS ("9876543210:123456,…").
// No WhatsApp message is sent for them. Ignored in production builds: a known
// code on a real (possibly admin) number would be an open door.
function testOtpFor(phoneNumber: string): string | null {
  if (process.env.NODE_ENV === "production") return null;
  for (const entry of (process.env.OTP_TEST_NUMBERS ?? "").split(",")) {
    const [number, code] = entry.trim().split(":");
    if (number === phoneNumber && /^\d{6}$/.test(code ?? "")) return code;
  }
  return null;
}

function generateOtp(): string {
  return Array.from({ length: OTP_LENGTH }, () => randomInt(10)).join("");
}

// Codes are stored as an HMAC so a database read doesn't hand out live codes.
// The phone number is mixed in so equal codes for two numbers hash differently.
function hashOtp(phoneNumber: string, otp: string): string {
  return createHmac("sha256", process.env.NEXT_AUTH_SECRET!)
    .update(`${phoneNumber}:${otp}`)
    .digest("hex");
}

export type IssueOtpResult =
  | { ok: true; retryAfter: number }
  | { ok: false; status: 429; message: string; retryAfter?: number };

export async function issueOtp(
  phoneNumber: string,
  ip: string | null,
): Promise<IssueOtpResult> {
  await dbConnect();

  const recentOtp = await OtpStore.findOne({ phoneNumber }).sort({
    createdAt: -1,
  });
  if (recentOtp) {
    const secondsSinceSent =
      (Date.now() - new Date(recentOtp.createdAt).getTime()) / 1000;
    if (secondsSinceSent < RESEND_COOLDOWN_SECONDS) {
      const retryAfter = Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceSent);
      return {
        ok: false,
        status: 429,
        message: `Please wait ${retryAfter} seconds before requesting another OTP.`,
        retryAfter,
      };
    }
  }

  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const [phoneSends, ipSends] = await Promise.all([
    OtpSendLog.countDocuments({
      key: `phone:${phoneNumber}`,
      createdAt: { $gt: hourAgo },
    }),
    ip
      ? OtpSendLog.countDocuments({ key: `ip:${ip}`, createdAt: { $gt: hourAgo } })
      : Promise.resolve(0),
  ]);
  if (
    phoneSends >= MAX_SENDS_PER_PHONE_PER_HOUR ||
    ipSends >= MAX_SENDS_PER_IP_PER_HOUR
  ) {
    return {
      ok: false,
      status: 429,
      message: "Too many OTP requests. Please try again in a while.",
    };
  }

  const testOtp = testOtpFor(phoneNumber);
  const otp = testOtp ?? generateOtp();
  await OtpStore.deleteMany({ phoneNumber });
  await OtpStore.create({
    phoneNumber,
    otp: hashOtp(phoneNumber, otp),
    expiresAt: new Date(Date.now() + OTP_TTL_SECONDS * 1000),
  });
  await OtpSendLog.insertMany([
    { key: `phone:${phoneNumber}` },
    ...(ip ? [{ key: `ip:${ip}` }] : []),
  ]);

  if (testOtp) {
    console.log(`[otp] test number ${phoneNumber}: fixed code, not sent`);
  } else if (otpProvider() === "console") {
    console.log(`[otp] code for ${phoneNumber}: ${otp}`);
  } else {
    await sendWhatsAppOtp(phoneNumber, otp);
  }

  return { ok: true, retryAfter: RESEND_COOLDOWN_SECONDS };
}

export type VerifyOtpResult =
  | { ok: true }
  | { ok: false; message: string };

export async function verifyOtp(
  phoneNumber: string,
  otp: string,
): Promise<VerifyOtpResult> {
  await dbConnect();

  // Claim an attempt atomically: the filter only matches while attempts are
  // left, so parallel guesses can't each read a stale count and slip past.
  const record = await OtpStore.findOneAndUpdate(
    {
      phoneNumber,
      expiresAt: { $gt: new Date() },
      attempts: { $lt: MAX_VERIFY_ATTEMPTS },
    },
    { $inc: { attempts: 1 } },
    { new: true, sort: { createdAt: -1 } },
  );

  if (!record) {
    const exhausted = await OtpStore.exists({
      phoneNumber,
      expiresAt: { $gt: new Date() },
    });
    return {
      ok: false,
      message: exhausted
        ? "Too many incorrect attempts. Please request a new OTP."
        : "OTP expired or not found. Please request a new one.",
    };
  }

  const expected = Buffer.from(record.otp, "hex");
  const actual = Buffer.from(hashOtp(phoneNumber, otp), "hex");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    const attemptsLeft = MAX_VERIFY_ATTEMPTS - record.attempts;
    return {
      ok: false,
      message:
        attemptsLeft > 0
          ? `Incorrect OTP. ${attemptsLeft} attempt(s) remaining.`
          : "Incorrect OTP. No attempts remaining. Please request a new OTP.",
    };
  }

  // Consume the code. Checking the delete count makes a code single-use even
  // when two correct submissions race.
  const { deletedCount } = await OtpStore.deleteOne({ _id: record._id });
  if (deletedCount !== 1) {
    return { ok: false, message: "OTP already used. Please request a new one." };
  }

  return { ok: true };
}

export function clientIp(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim() || null;
  return headers.get("x-real-ip");
}
