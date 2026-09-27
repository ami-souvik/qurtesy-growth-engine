import { Metadata } from "next"
import { RoastResumeClient } from "./roast-resume-client"

export const metadata: Metadata = {
  title: "Roast My Resume | Qurtesy Growth Engine",
  description:
    "Analyze and roast Reddit resumes with honest, zero-hallucination AI diagnostics, bullet surgery, and ATS parsing checks.",
}

export default function RoastResumePage() {
  return <RoastResumeClient />
}
