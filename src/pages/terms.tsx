import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import Head from "next/head";

export default function TermsOfService() {
  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>Terms of Service - React2Shell Scanner</title>
      </Head>
      <Header />
      <main className="flex-1 container max-w-4xl py-12 px-4 md:px-6 mx-auto">
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
          <p className="text-muted-foreground mb-8"><strong>Last Updated:</strong> January 2, 2026</p>
          
          <p className="mb-4">These Terms of Service ("Terms") govern your use of the React2Shell Scanner service ("Service"). By using our Service, you agree to these Terms.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Service Description</h2>
          <p className="mb-4">React2Shell Scanner is a vulnerability assessment tool that checks websites for susceptibility to CVE-2025-55182 (React2Shell), a remote code execution vulnerability in React Server Components.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Authorization Requirement</h2>
          <div className="bg-muted p-4 rounded-lg border my-6">
            <p className="mb-4"><strong>IMPORTANT:</strong> By using this Service, you represent and warrant that:</p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>You <strong>own</strong> the website being scanned, <strong>OR</strong></li>
              <li>You have <strong>explicit written authorization</strong> from the website owner to perform security testing, <strong>OR</strong></li>
              <li>You are acting within the scope of a <strong>legitimate bug bounty program</strong> that permits such scanning.</li>
            </ul>
            <p><strong>Unauthorized scanning of websites is illegal</strong> and may violate the Computer Fraud and Abuse Act (CFAA), Computer Misuse Act, or similar laws in your jurisdiction. We are not responsible for your compliance with applicable laws.</p>
          </div>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Acceptable Use</h2>
          <p className="mb-2">You agree <strong>NOT</strong> to:</p>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>Scan any URL without proper authorization</li>
            <li>Use the Service to facilitate attacks, exploitation, or unauthorized access</li>
            <li>Attempt to overwhelm, disrupt, or abuse the Service (rate limiting, DoS)</li>
            <li>Reverse engineer, decompile, or extract source code from the Service</li>
            <li>Use automated tools to access the Service beyond normal usage patterns</li>
            <li>Misrepresent scan results or use them to harm others</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. No Guarantees</h2>
          <p className="mb-2">The Service is provided <strong>"AS IS"</strong> without warranties of any kind.</p>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li><strong>Scan results are not guaranteed</strong> to be accurate, complete, or current.</li>
            <li>A "not vulnerable" result does <strong>not</strong> guarantee security.</li>
            <li>A "vulnerable" result should be verified through additional testing.</li>
            <li>We do not guarantee uninterrupted or error-free service.</li>
          </ul>
          <p className="mb-4">You acknowledge that vulnerability detection is inherently imperfect and that false positives and false negatives may occur.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Limitation of Liability</h2>
          <p className="mb-2">To the maximum extent permitted by law:</p>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>We are <strong>not liable</strong> for any damages arising from your use of the Service, including direct, indirect, incidental, consequential, or punitive damages.</li>
            <li>We are <strong>not liable</strong> for any actions you take based on scan results.</li>
            <li>We are <strong>not liable</strong> for any legal consequences resulting from unauthorized scanning.</li>
            <li>Our total liability shall not exceed the amount you paid for the Service (if any).</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Indemnification</h2>
          <p className="mb-2">You agree to indemnify and hold harmless React2Shell Scanner, its operators, and affiliates from any claims, damages, losses, or expenses (including legal fees) arising from:</p>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>Your use of the Service</li>
            <li>Your violation of these Terms</li>
            <li>Your violation of any applicable law</li>
            <li>Any unauthorized scanning you perform</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Intellectual Property</h2>
          <p className="mb-4">The Service, including its design, code, and branding, is owned by us and protected by intellectual property laws. You may not copy, modify, or distribute any part of the Service without permission.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Termination</h2>
          <p className="mb-4">We reserve the right to suspend or terminate your access to the Service at any time, for any reason, without notice. Sections 4, 5, 6, and 7 survive termination.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">9. Modifications</h2>
          <p className="mb-4">We may modify these Terms at any time. Continued use of the Service after changes constitutes acceptance of the modified Terms.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">10. Governing Law</h2>
          <p className="mb-4">These Terms are governed by the laws of the State of Florida, United States, without regard to its conflict of law provisions. Any disputes arising from these Terms or your use of the Service shall be resolved exclusively in the state or federal courts located in Florida, and you consent to the personal jurisdiction of such courts.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">11. Severability</h2>
          <p className="mb-4">If any provision of these Terms is found unenforceable, the remaining provisions remain in effect.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">12. Contact</h2>
          <p className="mb-8">For questions about these Terms, contact us via the support channel at support@react2shellscan.com.</p>
          
          <hr className="my-8" />
          <p className="font-bold text-center">By using React2Shell Scanner, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
