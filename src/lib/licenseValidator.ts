// src/lib/licenseValidator.ts
// ===== LICENSE VALIDATION API WITH SUPABASE =====

import { supabase } from "./supabase";

// ===== TYPES =====
export interface LicenseValidationResult {
  valid: boolean;
  license_key?: string;
  product_name?: string;
  customer_email?: string;
  status?: string;
  expires_at?: string;
  message: string;
}

// ===== MAIN VALIDATE FUNCTION =====
/**
 * Validate a license key against Supabase database
 * @param licenseKey - The license key to validate
 * @returns LicenseValidationResult
 */
export async function validateLicense(
  licenseKey: string
): Promise<LicenseValidationResult> {
  try {
    console.log("🔍 Validating license key:", licenseKey);

    // ===== CHECK IF EMPTY =====
    if (!licenseKey || licenseKey.trim() === "") {
      return {
        valid: false,
        message: "License key is empty",
      };
    }

    // ===== QUERY DATABASE =====
    console.log("📊 Querying Supabase...");

    const { data, error } = await supabase
      .from("licenses")
      .select(
        `
        id,
        license_key,
        status,
        expires_at,
        type,
        max_activations,
        current_activations,
        product_id,
        customer_email,
        products(name),
        customers(name, email)
      `
      )
      .eq("license_key", licenseKey.trim().toUpperCase())
      .maybeSingle();

    if (error) {
      console.error("❌ Database Error:", error);
      return {
        valid: false,
        message: "Database error during validation",
      };
    }

    // ===== LICENSE NOT FOUND =====
    if (!data) {
      console.log("❌ License key not found");
      return {
        valid: false,
        message: "License key does not exist",
      };
    }

    console.log("✅ License found:", data.license_key);

    // ===== CHECK STATUS =====
    if (data.status !== "active") {
      console.log("❌ License is not active. Status:", data.status);
      return {
        valid: false,
        license_key: data.license_key,
        status: data.status,
        message: `License is ${data.status}. Please contact support.`,
      };
    }

    // ===== CHECK EXPIRATION DATE =====
    if (data.expires_at) {
      const expiryDate = new Date(data.expires_at);
      const now = new Date();

      if (now > expiryDate) {
        console.log("❌ License is expired");
        return {
          valid: false,
          license_key: data.license_key,
          expires_at: data.expires_at,
          message: "License has expired",
        };
      }

      // Warn if expires soon
      const daysLeft = Math.floor(
        (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysLeft < 30) {
        console.warn(`⚠️ License expires in ${daysLeft} days`);
      }
    }

    // ===== CHECK ACTIVATION LIMIT =====
    if (
      data.max_activations &&
      data.current_activations >= data.max_activations
    ) {
      console.log("❌ Max activations reached");
      return {
        valid: false,
        license_key: data.license_key,
        message: "Maximum number of activations reached",
      };
    }

    // ===== LICENSE IS VALID ✅ =====
    console.log("✅ License key is VALID!");

    return {
      valid: true,
      license_key: data.license_key,
      product_name: data.products?.name || "Unknown Product",
      customer_email: data.customers?.email || data.customer_email || "Unknown",
      status: data.status,
      expires_at: data.expires_at,
      message: "License key is valid",
    };
  } catch (err: any) {
    console.error("❌ Unexpected error:", err);
    return {
      valid: false,
      message: "An unexpected error occurred",
    };
  }
}

// ===== INCREMENT ACTIVATION =====
/**
 * Increment activation count for a license
 * @param licenseKey - The license key
 * @returns boolean - Success or not
 */
export async function incrementActivation(licenseKey: string): Promise<boolean> {
  try {
    console.log("📈 Incrementing activation for:", licenseKey);

    // Get current activations
    const { data: license, error: fetchError } = await supabase
      .from("licenses")
      .select("id, current_activations, max_activations")
      .eq("license_key", licenseKey.trim().toUpperCase())
      .maybeSingle();

    if (fetchError || !license) {
      console.error("❌ License not found");
      return false;
    }

    // Check if max reached
    if (license.current_activations >= license.max_activations) {
      console.error("❌ Max activations reached");
      return false;
    }

    // Increment
    const { error: updateError } = await supabase
      .from("licenses")
      .update({
        current_activations: license.current_activations + 1,
      })
      .eq("id", license.id);

    if (updateError) {
      console.error("❌ Update Error:", updateError);
      return false;
    }

    console.log(
      `✅ Activation incremented: ${license.current_activations + 1}/${license.max_activations}`
    );
    return true;
  } catch (err: any) {
    console.error("❌ Error:", err);
    return false;
  }
}

// ===== TEST LICENSE (FOR DEVELOPMENT) =====
/**
 * Test a license key (for development only)
 * @param licenseKey - The license key to test
 */
export async function testLicense(licenseKey: string): Promise<void> {
  console.log("\n🧪 === LICENSE TEST START ===\n");

  const result = await validateLicense(licenseKey);

  console.log("\n📋 Result:");
  console.log("════════════════════════════════════════════");
  console.log(`Valid: ${result.valid ? "✅ YES" : "❌ NO"}`);
  console.log(`License Key: ${result.license_key || "N/A"}`);
  console.log(`Product: ${result.product_name || "N/A"}`);
  console.log(`Customer: ${result.customer_email || "N/A"}`);
  console.log(`Status: ${result.status || "N/A"}`);
  console.log(`Expires: ${result.expires_at || "Never"}`);
  console.log(`Message: ${result.message}`);
  console.log("════════════════════════════════════════════\n");

  if (result.valid) {
    console.log("🚀 License is VALID and can be used!\n");
  } else {
    console.log("❌ License is INVALID!\n");
  }

  console.log("🧪 === LICENSE TEST END ===\n");
}