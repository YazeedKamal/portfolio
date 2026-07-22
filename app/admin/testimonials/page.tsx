import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { TestimonialManager } from "@/components/admin/TestimonialManager";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Testimonial } from "@/lib/types";

export const revalidate = 0;

export default async function AdminTestimonialsPage() {
  if (!isSupabaseConfigured) redirect("/admin");

  const supabase = await createClient();
  const { data } = await supabase
    .from("testimonials")
    .select("*")
    .order("order_index", { ascending: true });

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-14">
      <AdminNav />

      <TestimonialManager initialTestimonials={(data ?? []) as Testimonial[]} />
    </main>
  );
}
