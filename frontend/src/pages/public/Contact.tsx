import { useState } from 'react'
import { Mail, Clock, MapPin, Send } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Form submission logic would go here
    console.log('Form submitted:', formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="min-h-screen py-20 px-4 bg-bg">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-text mb-4">
            Get in Touch
          </h1>
          <p className="text-xl text-text-secondary">
            Have questions? We're here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <h2 className="font-heading text-2xl font-bold text-text mb-6">
                Send us a Message
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    id="name"
                    name="name"
                    label="Name"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    label="Email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <Input
                  id="subject"
                  name="subject"
                  label="Subject"
                  placeholder="How can we help?"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                />

                <div className="space-y-1.5">
                  <label htmlFor="message" className="block text-sm font-medium text-text-secondary">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors duration-150"
                    placeholder="Tell us more about your inquiry..."
                    value={formData.message}
                    onChange={handleChange}
                    required
                  />
                </div>

                <Button type="submit" variant="cta" size="lg" className="w-full md:w-auto">
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </form>
            </Card>
          </div>

          {/* Contact Info Sidebar */}
          <div className="space-y-6">
            <Card>
              <div className="flex items-start space-x-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium text-text mb-1">Email</h3>
                  <a
                    href="mailto:support@echobilling.com"
                    className="text-text-secondary hover:text-primary transition-colors"
                  >
                    support@echobilling.com
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium text-text mb-1">Business Hours</h3>
                  <p className="text-text-secondary text-sm">24/7 Support Available</p>
                  <p className="text-text-secondary text-sm">Response within 2 hours</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium text-text mb-1">Address</h3>
                  <p className="text-text-secondary text-sm">
                    Delaware, United States
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <h3 className="font-heading text-lg font-semibold text-text mb-2">
                Need Immediate Help?
              </h3>
              <p className="text-text-secondary text-sm mb-4">
                For urgent technical issues, please contact our support team directly.
              </p>
              <Button variant="primary" size="sm" className="w-full">
                Open Support Ticket
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
