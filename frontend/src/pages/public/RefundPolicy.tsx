import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import Card from '../../components/ui/Card'

export default function RefundPolicy() {
  return (
    <div className="min-h-screen py-20 px-4 bg-bg">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-text mb-4">
            Refund Policy
          </h1>
          <p className="text-text-secondary">
            Last updated: February 13, 2026
          </p>
        </div>

        <Card className="mb-8 bg-cta/10 border-cta/30">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-6 h-6 text-cta flex-shrink-0 mt-1" />
            <div>
              <h2 className="font-heading text-xl font-bold text-text mb-2">
                7-Day Money-Back Guarantee
              </h2>
              <p className="text-text-secondary">
                We offer a full refund within 7 days of your initial purchase for new customers.
                This gives you time to test our services risk-free.
              </p>
            </div>
          </div>
        </Card>

        <Card className="prose prose-invert max-w-none">
          <div className="space-y-8">
            <section>
              <h2 className="font-heading text-2xl font-bold text-text mb-4">
                1. Eligibility for Refunds
              </h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                To be eligible for a refund, the following conditions must be met:
              </p>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-cta flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-text font-medium mb-1">New Accounts</p>
                    <p className="text-text-secondary text-sm">
                      The refund request must be made within 7 days of your first service purchase.
                      This applies only to your initial order with EchoBilling.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-cta flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-text font-medium mb-1">Annual Plans</p>
                    <p className="text-text-secondary text-sm">
                      Annual subscriptions are eligible for pro-rated refunds if cancelled within
                      the first 30 days. After 30 days, no refunds will be issued, but service will
                      continue until the end of the billing period.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-cta flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-text font-medium mb-1">Service Issues</p>
                    <p className="text-text-secondary text-sm">
                      If we are unable to resolve a technical issue that prevents you from using
                      our services as described, you may be eligible for a refund regardless of the
                      7-day window.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-bold text-text mb-4">
                2. Non-Refundable Items
              </h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                The following are not eligible for refunds:
              </p>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <XCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-text font-medium mb-1">Used Services Beyond 7 Days</p>
                    <p className="text-text-secondary text-sm">
                      Services used for more than 7 days are not eligible for refunds, except in
                      cases of unresolved technical issues.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <XCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-text font-medium mb-1">Renewal Payments</p>
                    <p className="text-text-secondary text-sm">
                      Automatic renewal payments are non-refundable. Please cancel before your
                      renewal date if you do not wish to continue service.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <XCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-text font-medium mb-1">Terms of Service Violations</p>
                    <p className="text-text-secondary text-sm">
                      Accounts terminated due to violations of our Terms of Service or Acceptable
                      Use Policy are not eligible for refunds.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <XCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-text font-medium mb-1">Add-on Services</p>
                    <p className="text-text-secondary text-sm">
                      Additional services such as extra bandwidth, storage upgrades, or dedicated
                      IPs are non-refundable once provisioned.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-bold text-text mb-4">
                3. How to Request a Refund
              </h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                To request a refund, please follow these steps:
              </p>
              <ol className="list-decimal list-inside text-text-secondary space-y-3 ml-4">
                <li>
                  Log in to your account portal and navigate to the Billing section
                </li>
                <li>
                  Click on "Request Refund" for the eligible service
                </li>
                <li>
                  Provide a brief reason for your refund request (optional but helpful)
                </li>
                <li>
                  Submit your request and await confirmation via email
                </li>
              </ol>
              <p className="text-text-secondary leading-relaxed mt-4">
                Alternatively, you can contact our support team at{' '}
                <span className="text-primary">billing@echobilling.com</span> with your account
                details and refund request.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-bold text-text mb-4">
                4. Refund Processing Time
              </h2>
              <p className="text-text-secondary leading-relaxed mb-3">
                Once your refund request is approved:
              </p>
              <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4">
                <li>Refunds are processed within 5-7 business days</li>
                <li>The refund will be credited to your original payment method</li>
                <li>Depending on your bank or card issuer, it may take an additional 3-5 business
                    days for the refund to appear in your account</li>
                <li>You will receive an email confirmation once the refund has been processed</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-bold text-text mb-4">
                5. Dispute Resolution
              </h2>
              <p className="text-text-secondary leading-relaxed mb-3">
                If your refund request is denied and you believe this decision was made in error:
              </p>
              <ol className="list-decimal list-inside text-text-secondary space-y-2 ml-4">
                <li>
                  Contact our billing department at billing@echobilling.com with your case details
                </li>
                <li>
                  Provide any supporting documentation or evidence
                </li>
                <li>
                  A senior team member will review your case within 3 business days
                </li>
                <li>
                  You will receive a final decision via email
                </li>
              </ol>
              <p className="text-text-secondary leading-relaxed mt-4">
                We are committed to fair and transparent refund practices. If you are not satisfied
                with our resolution, you may escalate the matter through your payment provider's
                dispute process.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-bold text-text mb-4">
                6. Partial Refunds
              </h2>
              <p className="text-text-secondary leading-relaxed">
                In certain situations, partial refunds may be granted at our discretion. This
                includes cases where services were partially unavailable due to technical issues on
                our end, or where a pro-rated refund is appropriate based on usage. Partial refunds
                are calculated based on the unused portion of your service period.
              </p>
            </section>

            <section className="bg-surface/50 rounded-lg p-6 border border-border">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-heading text-lg font-bold text-text mb-2">
                    Questions About Refunds?
                  </h3>
                  <p className="text-text-secondary mb-3">
                    If you have any questions about our refund policy or need assistance with a
                    refund request, please don't hesitate to contact us.
                  </p>
                  <p className="text-text-secondary">
                    Email: <span className="text-primary">billing@echobilling.com</span>
                  </p>
                </div>
              </div>
            </section>
          </div>
        </Card>
      </div>
    </div>
  )
}
