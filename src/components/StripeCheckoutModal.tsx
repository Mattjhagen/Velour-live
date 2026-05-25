import React, { useState } from 'react';
import { CreditCard, CheckCircle2, X, AlertCircle, Loader2 } from 'lucide-react';

interface StripeCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  authToken: string;
  onPaymentSuccess: (newTier: 'pro' | 'enterprise') => void;
}

export default function StripeCheckoutModal({ isOpen, onClose, authToken, onPaymentSuccess }: StripeCheckoutModalProps) {
  const [checkoutType, setCheckoutType] = useState<'subscription' | 'onetime'>('subscription');
  const [billingName, setBillingName] = useState('Matthew J. Hagen');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('12/28');
  const [cvc, setCvc] = useState('123');
  const [promoCode, setPromoCode] = useState('');
  
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successReceipt, setSuccessReceipt] = useState<any>(null);

  if (!isOpen) return null;

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    setProcessing(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          checkoutType,
          cardNumber,
          cardExpiry: expiry,
          cardCvc: cvc,
          promoCode,
          billingName
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Payment authorization aborted. Please review billing details.');
      } else {
        setSuccessReceipt(data.receipt);
        onPaymentSuccess(data.userTier);
      }
    } catch (err) {
      setErrorMessage('Billing service timed out. Please try again.');
    } finally {
      setProcessing(false);
    }
  }

  function useDemoCard(type: 'approved' | 'prepaid') {
    if (type === 'approved') {
      setCardNumber('4242 4242 4242 4242');
      setBillingName('Matthew J. Hagen');
      setErrorMessage(null);
    } else {
      setCardNumber('4000 0012 3456 7890');
      setBillingName('Matthew J. Hagen (Prepaid)');
      setErrorMessage(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4 text-left">
      <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl w-full max-w-md relative shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-zinc-800/60">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-zinc-400" />
            <h3 className="text-sm font-semibold text-zinc-100">Checkout</h3>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {!successReceipt ? (
          <form onSubmit={handleCheckout} className="p-5 space-y-5">
            {/* Purchase Options */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-950 rounded-lg border border-zinc-800/60">
              <button
                type="button"
                onClick={() => setCheckoutType('subscription')}
                className={`py-2 px-1 text-[11px] font-semibold rounded-md transition-all ${checkoutType === 'subscription' ? 'bg-zinc-800 text-zinc-150' : 'bg-transparent text-zinc-400 hover:text-zinc-200'}`}
              >
                Velour Pro Plan <span className="block text-[9px] font-normal text-zinc-400 mt-0.5">$29 / month</span>
              </button>
              <button
                type="button"
                onClick={() => setCheckoutType('onetime')}
                className={`py-2 px-1 text-[11px] font-semibold rounded-md transition-all ${checkoutType === 'onetime' ? 'bg-zinc-800 text-zinc-150' : 'bg-transparent text-zinc-400 hover:text-zinc-200'}`}
              >
                One-time Audit <span className="block text-[9px] font-normal text-zinc-400 mt-0.5">$9 single-use</span>
              </button>
            </div>

            {/* Test Cards Simulator */}
            <div className="bg-zinc-950/40 p-3.5 rounded-lg border border-zinc-800/60 text-[11px] space-y-2">
              <span className="text-zinc-300 font-medium block">
                Billing scenarios
              </span>
              <p className="text-zinc-500 leading-normal text-[10px]">Configure test cards to review checkout workflow transitions:</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => useDemoCard('approved')}
                  className="flex-1 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-850 transition text-[10px]"
                >
                  Approve Card
                </button>
                <button
                  type="button"
                  onClick={() => useDemoCard('prepaid')}
                  className="flex-1 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-850 transition text-[10px]"
                >
                  Block Prepaid Card
                </button>
              </div>
            </div>

            {/* Inputs */}
            <div className="space-y-3.5">
              <div>
                <label className="text-[10px] font-medium text-zinc-450 uppercase tracking-widest block mb-1">Name on Card</label>
                <input
                  type="text"
                  required
                  value={billingName}
                  onChange={(e) => setBillingName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div>
                <label className="text-[10px] font-medium text-zinc-450 uppercase tracking-widest block mb-1">Card Number</label>
                <input
                  type="text"
                  required
                  placeholder="4242 4242 4242 4242"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-medium text-zinc-450 uppercase tracking-widest block mb-1">Expiry Date</label>
                  <input
                    type="text"
                    required
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg p-2 w-full text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-zinc-450 uppercase tracking-widest block mb-1">CVC Code</label>
                  <input
                    type="password"
                    required
                    placeholder="***"
                    maxLength={4}
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg p-2 w-full text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Error message */}
            {errorMessage && (
              <div className="p-3 bg-rose-950/20 border border-rose-900/40 rounded-xl flex gap-2 text-xs text-rose-300 items-start">
                <AlertCircle className="w-4 h-4 text-rose-455 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{errorMessage}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={processing}
              className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold py-2.5 rounded-lg text-xs transition flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-955" />
                  <span>Authorizing...</span>
                </>
              ) : (
                <span>Confirm Payment</span>
              )}
            </button>
          </form>
        ) : (
          /* Receipt Success state */
          <div className="p-6 text-center space-y-4">
            <div className="mx-auto w-10 h-10 rounded-full bg-zinc-850 border border-zinc-750 flex items-center justify-center text-zinc-300 mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-450" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-105">Payment processed successfully</h4>
              <p className="text-xs text-zinc-400 mt-1">Thank you. Your account status has been updated.</p>
            </div>

            <div className="bg-zinc-950 rounded-lg p-4 text-left text-xs font-mono border border-zinc-800/60 space-y-2 text-zinc-400">
              <div><span className="text-zinc-500">Transaction ID:</span> {successReceipt.id}</div>
              <div><span className="text-zinc-500">Value processed:</span> ${(successReceipt.amount / 100).toFixed(2)} USD</div>
              <div><span className="text-zinc-500">Funding source:</span> {successReceipt.cardBrand} (•••• {successReceipt.cardLast4})</div>
              <div><span className="text-zinc-550">Registered time:</span> {new Date(successReceipt.timestamp).toLocaleString()}</div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs font-semibold rounded-lg transition"
            >
              Return to dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
