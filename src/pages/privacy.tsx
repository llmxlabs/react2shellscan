import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import Head from "next/head";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>Privacy Policy - React2Shell Scanner</title>
      </Head>
      <Header />
      <main className="flex-1 container max-w-4xl py-12 px-4 md:px-6 mx-auto">
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8"><strong>Last Updated:</strong> January 2, 2026</p>
          
          <p className="mb-4">This Privacy Policy describes how React2Shell Scanner ("we," "us," or "our") collects, uses, and protects information when you use our vulnerability scanning service.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Information We Collect</h2>
          
          <h3 className="text-xl font-medium mt-6 mb-2">Information You Provide</h3>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li><strong>URLs Submitted for Scanning:</strong> The website addresses you submit for vulnerability assessment.</li>
            <li><strong>Authorization Confirmation:</strong> Your acknowledgment that you have permission to scan the submitted URL.</li>
          </ul>
          
          <h3 className="text-xl font-medium mt-6 mb-2">Automatically Collected Information</h3>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li><strong>Scan Results:</strong> Technical data about vulnerability status of scanned URLs.</li>
            <li><strong>Scan History:</strong> Records of your previous scans (stored locally in your browser or associated with your session).</li>
            <li><strong>Usage Data:</strong> IP address, browser type, device information, and timestamp of requests.</li>
            <li><strong>Log Data:</strong> Server logs for security monitoring and service improvement.</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">How We Use Your Information</h2>
          <p className="mb-2">We use collected information to:</p>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>Perform vulnerability scans on URLs you submit</li>
            <li>Display scan history for your reference</li>
            <li>Maintain and improve service performance</li>
            <li>Detect and prevent abuse or unauthorized use</li>
            <li>Comply with legal obligations</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Data Retention</h2>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li><strong>Scan History:</strong> Retained for 30 days, then automatically deleted.</li>
            <li><strong>Server Logs:</strong> Retained for 90 days for security and debugging purposes.</li>
            <li><strong>Aggregated Analytics:</strong> May be retained indefinitely in non-identifiable form.</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Data Sharing</h2>
          <p className="mb-2">We do <strong>not</strong> sell your data. We may share information only:</p>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>With service providers who assist in operating our service (hosting, analytics)</li>
            <li>When required by law or valid legal process</li>
            <li>To protect our rights, safety, or property</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Security</h2>
          <p className="mb-4">We implement industry-standard security measures including encryption in transit (TLS), secure infrastructure, and access controls. However, no system is 100% secure.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Your Rights</h2>
          <p className="mb-2">Depending on your jurisdiction, you may have rights to:</p>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>Access the personal data we hold about you</li>
            <li>Request deletion of your data</li>
            <li>Opt out of certain data processing</li>
          </ul>
          <p className="mb-4">To exercise these rights, contact us via the support channel on our website.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Third-Party Links</h2>
          <p className="mb-4">Our service references external resources (e.g., CVE databases). We are not responsible for the privacy practices of third-party sites.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Changes to This Policy</h2>
          <p className="mb-4">We may update this Privacy Policy periodically. Material changes will be posted on this page with an updated revision date.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4 text-primary">Contact Us</h2>
          <p className="mb-8">For questions about this Privacy Policy, contact us via the support channel on our website.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
