"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";

const schema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  images: z
    .array(z.object({ url: z.string().url("Must be a valid URL") }))
    .min(1, "At least one image is required"),
  sourceStore: z.string().min(1, "Source store is required"),
  sourceUrl: z.string().url("Must be a valid URL"),
  sourcePrice: z.coerce.number().min(0, "Must be ≥ 0"),
  salePrice: z.coerce.number().min(0, "Must be ≥ 0"),
  deliveryEstimate: z.string().optional(),
  status: z.enum(["draft", "listed", "disabled"]),
});

type FormData = z.infer<typeof schema>;

interface Props {
  productId?: string;
  defaultValues?: Partial<FormData>;
}

export default function ProductForm({ productId, defaultValues }: Props) {
  const router = useRouter();
  const isEdit = !!productId;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: "draft",
      images: [{ url: "" }],
      ...defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "images" });

  const onSubmit = async (data: FormData) => {
    const payload = {
      ...data,
      images: data.images.map((i) => i.url),
    };

    const res = await fetch(
      isEdit ? `/api/products/${productId}` : "/api/products",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      setError("root", { message: "Failed to save product. Please try again." });
      return;
    }

    router.push("/dashboard/products");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      {/* Title */}
      <Field label="Title" error={errors.title?.message}>
        <input
          {...register("title")}
          className={input}
          placeholder="e.g. Minimal Leather Wallet"
        />
      </Field>

      {/* Description */}
      <Field label="Description" error={errors.description?.message}>
        <textarea
          {...register("description")}
          rows={4}
          className={input}
          placeholder="Describe the product…"
        />
      </Field>

      {/* Images */}
      <div>
        <label className={label}>Product Images (URLs)</label>
        <div className="space-y-2">
          {fields.map((field, i) => (
            <div key={field.id} className="flex gap-2">
              <input
                {...register(`images.${i}.url`)}
                className={`${input} flex-1`}
                placeholder="https://example.com/image.jpg"
              />
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="px-3 py-2 text-sm text-red-400 hover:text-red-600"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {errors.images && (
            <p className="text-xs text-red-500">
              {errors.images.message ?? errors.images[0]?.url?.message}
            </p>
          )}
          <button
            type="button"
            onClick={() => append({ url: "" })}
            className="text-sm text-gray-500 hover:text-gray-800 underline underline-offset-2"
          >
            + Add image
          </button>
        </div>
      </div>

      {/* Source info */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Source Store" error={errors.sourceStore?.message}>
          <input
            {...register("sourceStore")}
            className={input}
            placeholder="e.g. Amazon"
          />
        </Field>
        <Field label="Source URL" error={errors.sourceUrl?.message}>
          <input
            {...register("sourceUrl")}
            className={input}
            placeholder="https://amazon.com/product/..."
          />
        </Field>
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Source Price ($)" error={errors.sourcePrice?.message}>
          <input
            {...register("sourcePrice")}
            type="number"
            step="0.01"
            className={input}
            placeholder="0.00"
          />
        </Field>
        <Field label="Sale Price ($)" error={errors.salePrice?.message}>
          <input
            {...register("salePrice")}
            type="number"
            step="0.01"
            className={input}
            placeholder="0.00"
          />
        </Field>
      </div>

      {/* Delivery + Status */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Delivery Estimate" error={errors.deliveryEstimate?.message}>
          <input
            {...register("deliveryEstimate")}
            className={input}
            placeholder="e.g. 3–5 business days"
          />
        </Field>
        <Field label="Status" error={errors.status?.message}>
          <select {...register("status")} className={input}>
            <option value="draft">Draft</option>
            <option value="listed">Listed</option>
            <option value="disabled">Disabled</option>
          </select>
        </Field>
      </div>

      {errors.root && (
        <p className="text-sm text-red-600">{errors.root.message}</p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 bg-black text-white text-sm rounded-lg hover:bg-gray-900 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? "Saving…" : isEdit ? "Save changes" : "Create product"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 border border-gray-200 text-sm rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

const input =
  "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white";
const label = "block text-sm font-medium text-gray-700 mb-1";

function Field({
  label: l,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={label}>{l}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
