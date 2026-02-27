import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Initialize Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find pending payments for this user
    const { data: pendingPayments, error: fetchError } = await supabase
      .from('stripe_payments')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5);

    if (fetchError) {
      throw new Error(`Failed to fetch payments: ${fetchError.message}`);
    }

    if (!pendingPayments || pendingPayments.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending payments', credited: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let creditedAmount = 0;

    // Check each pending payment
    for (const payment of pendingPayments) {
      if (!payment.stripe_session_id) continue;

      try {
        // Retrieve session from Stripe
        const session = await stripe.checkout.sessions.retrieve(payment.stripe_session_id);

        if (session.payment_status === 'paid') {
          // Atomically update payment status (only if still pending)
          const { data: updatedPayment, error: updateError } = await supabase
            .from('stripe_payments')
            .update({
              status: 'completed',
              stripe_payment_intent_id: session.payment_intent as string,
              completed_at: new Date().toISOString(),
            })
            .eq('id', payment.id)
            .eq('status', 'pending')  // Only update if still pending
            .select()
            .single();

          if (updateError || !updatedPayment) {
            // Payment already processed by webhook or another request
            console.log(`Payment ${payment.id} already processed, skipping`);
            continue;
          }

          // Payment is complete - add credits
          const { error: creditError } = await supabase.rpc('add_credits_from_purchase', {
            p_user_id: user.id,
            p_credits: payment.credits_purchased,
            p_payment_id: payment.id,
          });

          if (creditError) {
            console.error('Failed to add credits:', creditError);
            // Revert status on failure
            await supabase
              .from('stripe_payments')
              .update({ status: 'failed' })
              .eq('id', payment.id);
            continue;
          }

          creditedAmount += payment.credits_purchased;
          console.log(`Added ${payment.credits_purchased} credits for payment ${payment.id}`);
        }
      } catch (stripeError) {
        console.error(`Error checking session ${payment.stripe_session_id}:`, stripeError);
      }
    }

    return new Response(
      JSON.stringify({
        message: creditedAmount > 0 ? `Added ${creditedAmount} credits` : 'No completed payments to process',
        credited: creditedAmount > 0,
        amount: creditedAmount,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error verifying payment:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
