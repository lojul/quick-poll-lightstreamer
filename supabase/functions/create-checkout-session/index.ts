import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Credit packages configuration (prices in HKD cents)
const CREDIT_PACKAGES = {
  small: { credits: 100, price_cents: 300, name: '100 閃幣' },      // HK$3
  medium: { credits: 500, price_cents: 1800, name: '500 閃幣' },    // HK$18
  large: { credits: 1200, price_cents: 3800, name: '1200 閃幣 (20% 額外)' }, // HK$38
} as const;

type PackageType = keyof typeof CREDIT_PACKAGES;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://quick-poll.up.railway.app';
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

    // Initialize Supabase with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the JWT and get user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { packageType } = await req.json() as { packageType: PackageType };

    if (!packageType || !CREDIT_PACKAGES[packageType]) {
      return new Response(
        JSON.stringify({ error: 'Invalid package type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const selectedPackage = CREDIT_PACKAGES[packageType];

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    let stripeCustomerId = profile?.stripe_customer_id;

    if (!stripeCustomerId) {
      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      stripeCustomerId = customer.id;

      // Save customer ID to profile
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', user.id);
    }

    // Create a pending payment record
    const { data: payment, error: paymentError } = await supabase
      .from('stripe_payments')
      .insert({
        user_id: user.id,
        amount_cents: selectedPackage.price_cents,
        credits_purchased: selectedPackage.credits,
        package_type: packageType,
        status: 'pending',
      })
      .select()
      .single();

    if (paymentError) {
      throw new Error(`Failed to create payment record: ${paymentError.message}`);
    }

    // Create Stripe Checkout session
    // Note: WeChat Pay requires CNY, Alipay supports limited currencies
    // For HKD, we use card payments only
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'hkd',
            product_data: {
              name: selectedPackage.name,
              description: `購買 ${selectedPackage.credits} 閃幣`,
            },
            unit_amount: selectedPackage.price_cents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${frontendUrl}?payment=success`,
      cancel_url: `${frontendUrl}?payment=cancelled`,
      metadata: {
        supabase_user_id: user.id,
        payment_id: payment.id,
        credits: selectedPackage.credits.toString(),
        package_type: packageType,
      },
    });

    // Update payment record with session ID
    await supabase
      .from('stripe_payments')
      .update({ stripe_session_id: session.id })
      .eq('id', payment.id);

    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
