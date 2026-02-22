'use client'

import { useState } from 'react'
import { Plan } from '@/lib/types'
import { getPlanDisplayName, getPlanColor, getDaysUntilTrialExpires } from '@/lib/plans'

interface SubscriptionManagementProps {
  subscription: any
  userPlan: Plan
}

export default function SubscriptionManagement({ subscription, userPlan }: SubscriptionManagementProps) {
  const [loading, setLoading] = useState(false)

  const handleUpgrade = () => {
    window.location.href = '/pricing'
  }

  const handleManageSubscription = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.success) {
        window.location.href = data.data.url
      } else {
        alert(data.error || 'Failed to open billing portal')
      }
    } catch (error) {
      console.error('Portal error:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const isTrialExpired = userPlan === 'expired' && subscription?.plan === 'free_trial'
  const isTrialActive = userPlan === 'free_trial' && subscription?.trial_ends_at
  const trialDaysLeft = isTrialActive ? getDaysUntilTrialExpires(subscription.trial_ends_at) : 0
  const hasActiveSubscription = subscription?.stripe_subscription_id && userPlan !== 'expired'

  return (
    <div className="space-y-6">
      {/* Plan Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Current Plan</h3>
            <div className="flex items-center mt-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPlanColor(userPlan)}`}>
                {getPlanDisplayName(userPlan)}
              </span>
              {isTrialActive && (
                <span className="ml-3 text-sm text-gray-600">
                  {trialDaysLeft} days left
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            {userPlan === 'free_trial' || userPlan === 'expired' ? (
              <button
                onClick={handleUpgrade}
                className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 text-sm font-medium"
              >
                Upgrade Plan
              </button>
            ) : hasActiveSubscription ? (
              <button
                onClick={handleManageSubscription}
                disabled={loading}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50 text-sm font-medium"
              >
                {loading ? 'Loading...' : 'Manage Subscription'}
              </button>
            ) : null}
          </div>
        </div>

        {/* Plan Details */}
        <div className="space-y-2 text-sm text-gray-600">
          {isTrialExpired && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium">Your free trial has expired</p>
              <p className="text-red-700 mt-1">
                Upgrade to continue accessing Planning Radar features
              </p>
            </div>
          )}

          {isTrialActive && trialDaysLeft <= 3 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 font-medium">
                Your trial expires in {trialDaysLeft} days
              </p>
              <p className="text-yellow-700 mt-1">
                Upgrade now to avoid interruption to your service
              </p>
            </div>
          )}

          {subscription?.status === 'past_due' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium">Payment Required</p>
              <p className="text-red-700 mt-1">
                Your subscription payment failed. Please update your payment method.
              </p>
            </div>
          )}

          {hasActiveSubscription && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-green-700"><strong>Status:</strong> {subscription.status}</p>
                  {subscription.current_period_end && (
                    <p className="text-green-700">
                      <strong>Next billing:</strong> {new Date(subscription.current_period_end).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div>
                  {subscription.stripe_subscription_id && (
                    <p className="text-green-700"><strong>Subscription ID:</strong> {subscription.stripe_subscription_id.slice(0, 12)}...</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Plan Features */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Plan Features</h3>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Search Features</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center">
                <span className="w-4 h-4 bg-green-400 rounded-full mr-3"></span>
                Council & postcode search
              </li>
              <li className="flex items-center">
                <span className={`w-4 h-4 rounded-full mr-3 ${
                  userPlan === 'pro' || userPlan === 'premium' ? 'bg-green-400' : 'bg-gray-300'
                }`}></span>
                Keyword search
                {userPlan === 'free_trial' && <span className="ml-2 text-xs text-gray-500">(Pro+)</span>}
              </li>
              <li className="flex items-center">
                <span className={`w-4 h-4 rounded-full mr-3 ${
                  userPlan === 'premium' ? 'bg-green-400' : 'bg-gray-300'
                }`}></span>
                Applicant/agent search
                {userPlan !== 'premium' && <span className="ml-2 text-xs text-gray-500">(Premium)</span>}
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-3">Data & Export</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center">
                <span className="w-4 h-4 bg-green-400 rounded-full mr-3"></span>
                {userPlan === 'free_trial' ? '10 results' :
                 userPlan === 'expired' ? '5 results' :
                 'Unlimited results'}
              </li>
              <li className="flex items-center">
                <span className="w-4 h-4 bg-green-400 rounded-full mr-3"></span>
                {userPlan === 'free_trial' || userPlan === 'expired' ? '7 days history' :
                 userPlan === 'pro' ? '1 year history' :
                 'Full history access'}
              </li>
              <li className="flex items-center">
                <span className={`w-4 h-4 rounded-full mr-3 ${
                  userPlan === 'premium' ? 'bg-green-400' : 'bg-gray-300'
                }`}></span>
                CSV export
                {userPlan !== 'premium' && <span className="ml-2 text-xs text-gray-500">(Premium)</span>}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}