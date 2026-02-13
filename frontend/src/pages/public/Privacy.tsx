import Card from '../../components/ui/Card'

export default function Privacy() {
  return (
    <div className="min-h-screen py-20 px-4 bg-bg">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-text mb-4">
            Privacy Policy
          </h1>
          <p className="text-text-secondary">
            Last updated: February 13, 2026
          </p>
        </div>

        <Card className="prose prose-invert max-w-none">
          <div className="space-y-8">
            <section>
              <h2 className="font-heading text-2xl font-bold text-text mb-4">
                1. Information We Collect
              </h2>
              <p className="text-text-secondary leading-relaxed mb-3">
                We collect information that you provide directly to us when you create an account,
                use our services, or communicate with us. This includes:
              </p>
              <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4">
                <li>Account information (name, email address, billing address)</li>
                <li>Payment information (processed securely through third-party payment processors)</li>
                <li>Technical information (IP addresses, server logs, usage data)</li>
                <li>Communications (support tickets, emails, chat messages)</li>
              </ul>
              <p className="text-text-secondary leading-relaxed mt-3">
                We automatically collect certain information when you use our services, including
                log data, device information, and usage patterns to improve service quality and
                security.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-bold text-text mb-4">
                2. How We Use Your Information
              </h2>
              <p className="text-text-secondary leading-relaxed mb-3">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Send technical notices, updates, and security alerts</li>
                <li>Respond to your comments, questions, and customer service requests</li>
                <li>Monitor and analyze trends, usage, and activities</li>
                <li>Detect, prevent, and address technical issues and security threats</li>
                <li>Comply with legal obligations and enforce our terms</li>
              </ul>
              <p className="text-text-secondary leading-relaxed mt-3">
                We will not sell your personal information to third parties. We may share
                information with service providers who assist us in operating our business, subject
                to confidentiality agreements.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-bold text-text mb-4">
                3. Data Security
              </h2>
              <p className="text-text-secondary leading-relaxed">
                We implement appropriate technical and organizational measures to protect your
                personal information against unauthorized access, alteration, disclosure, or
                destruction. This includes encryption of data in transit and at rest, regular
                security assessments, and access controls. However, no method of transmission over
                the internet or electronic storage is 100% secure, and we cannot guarantee absolute
                security.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-bold text-text mb-4">
                4. Cookies and Tracking Technologies
              </h2>
              <p className="text-text-secondary leading-relaxed mb-3">
                We use cookies and similar tracking technologies to collect and track information
                about your use of our services. Cookies are small data files stored on your device.
                We use both session cookies (which expire when you close your browser) and
                persistent cookies (which remain until deleted).
              </p>
              <p className="text-text-secondary leading-relaxed">
                You can instruct your browser to refuse all cookies or to indicate when a cookie is
                being sent. However, if you do not accept cookies, you may not be able to use some
                portions of our services. We use cookies for authentication, preferences, security,
                and analytics purposes.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-bold text-text mb-4">
                5. Third-Party Services
              </h2>
              <p className="text-text-secondary leading-relaxed">
                Our services may contain links to third-party websites or integrate with third-party
                services. We are not responsible for the privacy practices of these third parties.
                We encourage you to read the privacy policies of any third-party services you
                interact with. We may share information with trusted third-party service providers
                who assist us in operating our business, such as payment processors, hosting
                providers, and analytics services.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-bold text-text mb-4">
                6. Your Rights and Choices
              </h2>
              <p className="text-text-secondary leading-relaxed mb-3">
                You have certain rights regarding your personal information:
              </p>
              <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4">
                <li>Access: You can request a copy of your personal information</li>
                <li>Correction: You can update or correct inaccurate information</li>
                <li>Deletion: You can request deletion of your personal information</li>
                <li>Portability: You can request a copy of your data in a portable format</li>
                <li>Opt-out: You can opt out of marketing communications</li>
              </ul>
              <p className="text-text-secondary leading-relaxed mt-3">
                To exercise these rights, please contact us at privacy@echobilling.com. We will
                respond to your request within 30 days. Note that we may need to retain certain
                information for legal or administrative purposes.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-bold text-text mb-4">
                7. Data Retention
              </h2>
              <p className="text-text-secondary leading-relaxed">
                We retain your personal information for as long as necessary to provide our services
                and fulfill the purposes outlined in this policy. When you close your account, we
                will delete or anonymize your information within 30 days, except where we are
                required to retain it for legal, regulatory, or security purposes. Backup copies may
                persist for up to 90 days.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-bold text-text mb-4">
                8. International Data Transfers
              </h2>
              <p className="text-text-secondary leading-relaxed">
                Your information may be transferred to and processed in countries other than your
                country of residence. These countries may have data protection laws that differ from
                those in your country. We take appropriate safeguards to ensure your information
                receives adequate protection in accordance with this privacy policy.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-bold text-text mb-4">
                9. Children's Privacy
              </h2>
              <p className="text-text-secondary leading-relaxed">
                Our services are not directed to individuals under the age of 18. We do not
                knowingly collect personal information from children. If you become aware that a
                child has provided us with personal information, please contact us, and we will take
                steps to delete such information.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-bold text-text mb-4">
                10. Changes to This Policy
              </h2>
              <p className="text-text-secondary leading-relaxed">
                We may update this privacy policy from time to time. We will notify you of any
                material changes by posting the new policy on this page and updating the "Last
                updated" date. Your continued use of our services after such changes constitutes
                acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-bold text-text mb-4">
                11. Contact Us
              </h2>
              <p className="text-text-secondary leading-relaxed">
                If you have questions about this Privacy Policy or our data practices, please
                contact us at:
                <br />
                <span className="text-primary">privacy@echobilling.com</span>
              </p>
            </section>
          </div>
        </Card>
      </div>
    </div>
  )
}
