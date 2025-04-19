
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

interface RedeemResponse {
  status?: {
    code?: string;
    message?: string;
  };
  data?: {
    amount?: number;
    mobile?: string;
    voucher_hash?: string;
    voucher_id?: string;
  };
  amount?: number;
  message?: string;
}

serve(async (req) => {
  try {
    // Handle CORS preflight request
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    // Parse request body
    const { voucher_code } = await req.json();

    if (!voucher_code) {
      return new Response(
        JSON.stringify({ error: "Voucher code is required" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Make request to TrueMoney API
    const response = await fetch(
      `https://gift.truemoney.com/campaign/vouchers/${voucher_code}/redeem`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          mobile: "0653835988",
          voucher_hash: voucher_code,
        }),
      }
    );

    const data = await response.json();
    console.log("TrueMoney API response:", data);

    // Extract amount from response
    let amount = 0;
    if (data && (data.amount || (data.data && data.data.amount))) {
      amount = data.amount || data.data.amount;
    }

    return new Response(
      JSON.stringify({ 
        success: response.ok,
        amount,
        status: data.status,
        message: data.message || "Voucher redeemed successfully"
      }),
      {
        status: response.ok ? 200 : 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
