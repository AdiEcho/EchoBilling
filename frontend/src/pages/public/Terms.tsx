import Card from '../../components/ui/Card'

export default function Terms() {
  return (
    <div className="min-h-screen py-20 px-4 bg-bg">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-text mb-4">
            Terms of Service
          </h1>
          <p className="text-text-secondary">
            Last updated: February 13, 2026
          </p>
        </div>

        <Card className="prose prose-invert max-w-none">
          <div className="space-y-8">
            <section>
              <h2 className="font-heading text-2xl font-bold text-text mb-4">
                1. Acceptance of Terms
              </h2>
              <p className="text-text-secondary leading-relaxed">
                By accessing and using EchoBilling's services, you accept and agree to be bound by
                the terms and provision of this agreement. If you do not agree to abide by the
                above, please do not use this service. EchoBilling LLC ("Company", "we", "us", or
                "our") reserves the right to modify these terms at any time. Your continued use of
                the service constitutes acceptance of those changes.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-bold text-text mb-4">
                2. Description of Services
              </h2>
              <p className="text-text-secondary leading-relaxed mb-3">
                EchoBilling provides cloud infrastructure services including but not limited to
                Virtual Private Servers (VPS), hosting solutions, and related technical services.
                We reserve the right to modify, suspend, or discontinue any aspect of our services
                at any time with reasonable notice to customers.
              </p>
              <p className="text-text-secondary leading-relaxed">
                Service availability is subject to our Service Level Agreement (SLA). While we
                strive for maximum uptime, we cannot guarantee uninterrupted service due to factors
                beyond our control including maintenance, upgrades, and force majeure events.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-bold text-text mb-4">
                3. Account Registration and Security
              </h2>
              <p className="text-text-secondary leading-relaxed mb-3">
                You must provide accurate, current, and complete information during registration.
                You are responsible for maintaining the confidentiality of your account credentials
                and for all activities that occur under your account. You agree to immediately
                notify us of any unauthorized use of your account.
              </p>
              <p className="text-text-secondary leading-relaxed">
                Accounts are non-transferable. You may not share, sell, or otherwise transfer your
                account to another party. We reserve the right to suspend or terminate accounts that
                violate this provision.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-bold text-text mb-4">
                4. Payment Terms
              </h2>
              <p className="text-text-secondary leading-relaxed mb-3">
                All fees are stated in United States Dollars (USD) unless otherwise specified.
                Payment is due in advance for the selected billing cycle (monthly, quarterly, or
                annually). Services will be suspended if payment is not received within 7 days of
                the due date.
              </p>
              <p className="text-text-secondary leading-relaxed">
                You authorize us to charge your designated payment method for all fees incurred. If
                payment fails, you remain responsible for any uncollected amounts and may be charged
                a reasonable fee for each failed payment attempt. Price changes will be communicated
                at least 30 days in advance.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-bold text-text mb-4">
                5. Acceptable Use Policy
              </h2>
              <p className="text-text-secondary leading-relaxed mb-3">
                You agree not to use our services for any unlawful purpose or in any way that
                interrupts, damages, or impairs the service. Prohibited activities include but are
                not limited to:
              </p>
              <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4">
                <li>Hosting or distributing malware, viruses, or malicious code</li>
                <li>Engaging in spam, phishing, or fraudulent activities</li>
                <li>Violating intellectual property rights</li>
                <li>Conducting illegal activities or hosting illegal content</li>
                <li>Attempting to gain unauthorized access to other systems</li>
                <li>Excessive resource consumption that impacts other users</li>
              </ul>
              <p className="text-text-secondary leading-relaxed mt-3">
                Violation of this policy may result in immediate suspension or termination of
                services without refund.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-bold text-text mb-4">
                6. Service Termination
              </h2>
              <p className="text-text-secondary leading-relaxed">
                Either party may terminate services with written notice. You may cancel at any time
                through your account portal. Upon termination, you remain responsible for all fees
                incurred up to the termination date. We reserve the right to immediately terminate
                accounts that violate these terms without prior notice or refund. Data retention
                after termination is subject to our data retention policy.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-bold text-text mb-4">
                7. Limitation of Liability
              </h2>
              <p className="text-text-secondary leading-relaxed mb-3">
                To the maximum extent permitted by law, EchoBilling LLC shall not be liable for any
                indirect, incidental, special, consequential, or punitive damages, or any loss of
                profits or revenues, whether incurred directly or indirectly, or any loss of data,
                use, goodwill, or other intangible losses resulting from:
              </p>
              <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4">
                <li>Your use or inability to use the services</li>
                <li>Unauthorized access to or alteration of your data</li>
                <li>Service interruptions or errors</li>
                <li>Any conduct or content of third parties on the service</li>
              </ul>
              <p className="text-text-secondary leading-relaxed mt-3">
                Our total liability shall not exceed the amount you paid us in the twelve months
                preceding the claim.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-bold text-text mb-4">
                8. Governing Law and Dispute Resolution
              </h2>
              <p className="text-text-secondary leading-relaxed">
                These terms shall be governed by and construed in accordance with the laws of the
                State of Delaware, United States, without regard to its conflict of law provisions.
                Any disputes arising from these terms or your use of our services shall be resolved
                through binding arbitration in accordance with the rules of the American Arbitration
                Association. You agree to waive any right to a jury trial or to participate in a
                class action lawsuit.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-bold text-text mb-4">
                9. Contact Information
              </h2>
              <p className="text-text-secondary leading-relaxed">
                For questions about these Terms of Service, please contact us at:
                <br />
                <span className="text-primary">legal@echobilling.com</span>
              </p>
            </section>
          </div>
        </Card>
      </div>
    </div>
  )
}
