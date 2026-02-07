"use client"
import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import HeaderText from "@/components/HeaderText/HeaderText"
import SocialMedia from "@/components/SocialMedia/SocialMedia"
import { Button } from "@/components/ui/button"
import { useSubmitFeedbackMutation } from "@/store/api"
import toast from "react-hot-toast"
import { Loader2 } from "lucide-react"

export default function FeedbackForm() {
  const [feedback, setFeedback] = useState("")
  const [submitFeedback, { isLoading }] = useSubmitFeedbackMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!feedback.trim()) return

    try {
      await submitFeedback(feedback).unwrap()
      toast.success('Thanks for your feedback! We’ll get back to you soon')
    } catch {
      toast.success('Failed to record, please try again later')
    }
    setFeedback("")
  }

  return (
    <div className="flex flex-col p-20 max-md:p-4 max-md:pt-20 h-screen bg-brown-background">
      <HeaderText
        containerClassName="items-start"
        title="Help & Support"
        titleVariant="h3"
        titleClassName="font-bold"
      />
      <div className="grid grid-cols-2 mt-10 max-md:mt-2 max-md:grid-cols-1 max-md:gap-10">
        <form onSubmit={handleSubmit} className="space-y-4 flex flex-col gap-4 max-w-xl max-md:p-4 max-md:space-y-0 bg-brown-sidebar border border-brown-border rounded-md p-10 py-8">
          <div className="space-y-2">
            <Label htmlFor="feedback" className="text-white text-lg">Feedback / Query</Label>
            <Textarea

              id="feedback"
              placeholder="Tell us what you think..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-[140px] max-md:min-h-[100px] text-white"
            />
          </div>

          <Button type="submit" className={`w-full h-12`} disabled={!feedback||isLoading}>
            {isLoading && (
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            )}
            Submit feedback
          </Button>
        </form>
        <SocialMedia />
      </div>
    </div>
  )
}
