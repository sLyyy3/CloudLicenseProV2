// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.server" });

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Supabase Admin Client ---
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// --- Test Route ---
app.get("/", (req, res) => res.send("✅ Backend läuft!"));

// --- Users ---
app.get("/api/getUsers", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) throw error;
    res.status(200).json(data.users);
  } catch (err) {
    console.error("Admin API Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/deleteUser/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) throw error;
    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// --- Products ---
app.get("/api/products", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from("products").select("*");
    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    console.error("Products API Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- Customers ---
app.get("/api/customers", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from("customers").select("*");
    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    console.error("Customers API Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- Licenses ---
app.get("/api/licenses", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("licenses")
      .select(`
        id, license_key, status, type,
        product:products(name),
        customer:customers(name,email)
      `);
    if (error) throw error;

    const licenses = data.map((l) => ({
      id: l.id,
      license_key: l.license_key,
      status: l.status,
      type: l.type,
      product_name: l.product?.name,
      customer_name: l.customer?.name,
      customer_email: l.customer?.email,
    }));

    res.status(200).json(licenses);
  } catch (err) {
    console.error("Licenses API Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- License CRUD: Create ---
app.post("/api/licenses", async (req, res) => {
  try {
    const { product_id, customer_id, type } = req.body;
    if (!product_id || !customer_id) return res.status(400).json({ error: "Produkt und Kunde erforderlich" });

    const license_key =
      Math.random().toString(36).substring(2, 10).toUpperCase() +
      "-" +
      Math.random().toString(36).substring(2, 6).toUpperCase();

    const { data, error } = await supabaseAdmin.from("licenses").insert([{
      license_key,
      status: "active",
      product_id,
      customer_id,
      type
    }]).select();

    if (error) throw error;

    res.status(201).json(data[0]);
  } catch (err) {
    console.error("Create License Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- License CRUD: Delete ---
app.delete("/api/licenses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin.from("licenses").delete().eq("id", id);
    if (error) throw error;
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Delete License Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- License CRUD: Bulk Update Status ---
app.patch("/api/licenses/status", async (req, res) => {
  try {
    const { ids, status } = req.body;
    if (!ids || !status) return res.status(400).json({ error: "IDs und Status erforderlich" });

    const { error } = await supabaseAdmin.from("licenses").update({ status }).in("id", ids);
    if (error) throw error;
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Bulk Update Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- Server starten ---
app.listen(PORT, () => {
  console.log(`🚀 Backend läuft auf http://localhost:${PORT}`);
});
