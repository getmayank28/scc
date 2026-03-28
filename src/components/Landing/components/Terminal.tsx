import { Terminal } from "@/components/ui/terminal";

export function TerminalComponent() {
  return (
    <section className="w-lg py-10 max-md:px-20 max-md:mt-[0px]">
      <Terminal
        commands={[
          "Why join the waitlist?",
          "What do I get?",
          "Do I need to think about anything?",
          "Do I need to change my habits?",
        ]}
        outputs={{
          0: [
            "✔ Early users earn more then others.",
            "✔ Priority onboarding",
            "✔ Limited spots.",
          ],
          1: ["✔ Smarter swipes", "✔ More rewards", "✔ Zero efforts"],
          2: ["✔ No. We handle optimization." , "✔ You just swipe."],
          3:["No. Spend the same. Earn more"]
        }}
        typingSpeed={45}
        delayBetweenCommands={1000}
      />
    </section>
  );
}
