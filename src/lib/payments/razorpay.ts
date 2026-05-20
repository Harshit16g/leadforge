import Razorpay from "razorpay";

let _instance: Razorpay | null = null;

/** Lazily instantiated — safe to import in any server module. */
export function getRazorpay(): Razorpay {
  if (_instance) return _instance;

  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set");
  }

  _instance = new Razorpay({ key_id, key_secret });
  return _instance;
}
