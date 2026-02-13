import { AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react'
import Card from '../../components/ui/Card'

export default function CancellationPolicy() {
  return (
    <div className="min-h-screen py-20 px-4 bg-bg">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-text mb-4">
            Cancellation Policy
          </h1>
          <p className="text-text-secondary">
            Last updated: February 13, 2026
          </p>
        </div>

        <Card className="mb-8 bg-primary/10 border-primary/30">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
            <div>
              <h2 className="font-heading text-xl font-bold text-text mb-2">
                Cancel Anytime
              </h2>
              <p className="text-text-secondary">
                You can cancel your services at any time through your account portal or by
                contacting our support team. No long-term contracts or commitments required.
              </p>
            </div>
          </div>
        </Card>

        <Card className="prose prose-invert max-w-none">
          <div className="space-y-8">
            <section>
              <h2 className="font-heading text-2xl font-bold text-text mb-4">
                1. How to Cancel Your Service
              </h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                You have two convenient options to cancel your EchoBilling services:
              </p>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-cta flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-text font-medium mb-1">Through Your Account Portal</p>
                    <ol className="list-decimal list-inside text-text-secondary text-sm space-y-1 ml-4">
                      <li>Log in to your EchoBilling account</li>
                      <li>Navigate to Services or Billing section</li>
                      <li>Select the service you wish to cancel</li>
                      <li>Click "Cancel Service" and follow the prompts</li>
                      <li>Confirm your cancellation request</li>
                    </ol>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-cta flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-text font-medium mb-1">Contact Support</p>
                    <p className="text-text-secondary text-sm mb-2">
                      Email our support team at{' '}
                      <span className="text-primary">support@echobilling.com</span> with:
                    </p>
                    <ul className="list-disc list-inside text-text-secondary text-sm space-y-1 ml-4">
                      <li>Your account email address</li>
                      <li>Service(s) you wish to cancel</li>
                      <li>Reason for cancellation (optional but appreciated)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-bold text-text mb-4">
                2. When Does Cancellation Take Effect?
              </h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                Understanding when your cancellation becomes effective:
              </p>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-text font-medium mb-1">End of Billing Period</p>
                    <p className="text-text-secondary text-sm">
                      Your service will remain active until the end of your current billing period.
                      You will continue to have full access to your services until that date. No
                      pro-rated refunds are issued for the remaining time in your billing cycle.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-text font-medium mb-1">Immediate Cancellation</p>
                    <p className="text-text-secondary text-sm">
                      If you require immediate service termination, please contact support. Note
                      that immediate cancellations are not eligible for refunds, and you will lose
                      access to your data and services immediately.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-text font-medium mb-1">Auto-Renewal Prevention</p>
                    <p className="text-text-secondary text-sm">
                      Once cancelled, your service will not automatically renew. You will not be
                      charged for the next billing period. You will receive a confirmation email
                      once your cancellation is processed.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-bold text-text mb-4">
                3. Data Retention After Cancellation
              </h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                What happens to your data after you cancel:
              </p>

              <div className="bg-surface/50 rounded-lg p-4 border border-border mb-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-text font-medium mb-1">30-Day Grace Period</p>
                    <p className="text-text-secondary text-sm">
                      Your data will be retained for 30 days after your service ends. During this
                      time, you can reactivate your service and regain access to your data. After
                      30 days, all data will be permanently deleted and cannot be recovered.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-text-secondary text-sm">
                  <span className="font-medium text-text">Important:</span> We strongly recommend
                  backing up all important data before cancelling your service. EchoBilling is not
                  responsible for any data loss after the 30-day retention period.
                </p>
                <p className="text-text-secondary text-sm">
                  To download your data, use your account portal's backup feature or contact
                  support for assistance before your service ends.
                </p>
              </div>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-bold text-text mb-4">
                4. Reactivation Process
              </h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                Changed your mind? You can reactivate your service:
              </p>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-cta flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-text font-medium mb-1">Within 30 Days</p>
                    <p className="text-text-secondary text-sm">
                      If you reactivate within 30 days of cancellation, your data and
                      configurations will be restored. Simply log in to your account portal and
                      click "Reactivate Service" or contact support. You will be charged for a new
                      billing period upon reactivation.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <XCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-text font-medium mb-1">After 30 Days</p>
                    <p className="text-text-secondary text-sm">
                      If more than 30 days have passed, you will need to create a new service
                      instance. Your previous data and configurations cannot be recovered. You will
                      be treated as a new customer and may be eligible for new customer promotions.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-bold text-text mb-4">
                5. Cancellation Fees
              </h2>
              <p className="text-text-secondary leading-relaxed mb-3">
                EchoBilling does not charge cancellation fees. You are free to cancel at any time
                without penalty. However, please note:
              </p>
              <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4">
                <li>
                  You remain responsible for all charges incurred up to the cancellation date
                </li>
                <li>
                  No refunds are provided for unused time in your current billing period (except
                  within the 7-day money-back guarantee period for new customers)
                </li>
                <li>
                  Any outstanding balances must be paid before cancellation can be completed
                </li>
                <li>
                  Add-on services and upgrades are non-refundable upon cancellation
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-bold text-text mb-4">
                6. Involuntary Cancellation
              </h2>
              <p className="text-text-secondary leading-relaxed mb-3">
                EchoBilling reserves the right to cancel your service in the following situations:
              </p>
              <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4">
                <li>
                  Non-payment: Services will be suspended after 7 days of non-payment and
                  terminated after 14 days
                </li>
                <li>
                  Terms of Service violations: Immediate termination may occur for serious
                  violations
                </li>
                <li>
                  Acceptable Use Policy violations: Services may be terminated without refund
                </li>
                <li>
                  Fraudulent activity: Immediate termination and potential legal action
                </li>
              </ul>
              <p className="text-text-secondary leading-relaxed mt-3">
                In cases of involuntary cancellation, you will receive notification via email. You
                may have the opportunity to appeal the decision by contacting support within 7 days.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-bold text-text mb-4">
                7. Feedback and Exit Survey
              </h2>
              <p className="text-text-secondary leading-relaxed">
                We value your feedback and continuously strive to improve our services. When you
                cancel, you may be asked to complete a brief exit survey. Your responses help us
                understand how we can better serve our customers. Participation is optional but
                greatly appreciated.
              </p>
            </section>

            <section className="bg-surface/50 rounded-lg p-6 border border-border">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-heading text-lg font-bold text-text mb-2">
                    Need Help Before Cancelling?
                  </h3>
                  <p className="text-text-secondary mb-3">
                    If you're experiencing issues or have concerns, please contact our support team
                    before cancelling. We may be able to resolve your concerns or offer alternative
                    solutions.
                  </p>
                  <p className="text-text-secondary">
                    Email: <span className="text-primary">support@echobilling.com</span>
                    <br />
                    Available 24/7
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
