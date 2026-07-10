"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { FileText, Printer, Download, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function InvoicePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const orderId = params.id as string;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/verify?redirect=/account/orders/" + orderId + "/invoice");
      return;
    }
    if (status === "authenticated") {
      fetch(`/api/invoices/${orderId}`)
        .then((res) => {
          if (!res.ok) throw new Error("Erreur");
          return res.text();
        })
        .then((data) => {
          setHtml(data);
          setLoading(false);
        })
        .catch(() => {
          setError("Impossible de charger la facture");
          setLoading(false);
        });
    }
  }, [status, router, orderId]);

  useEffect(() => {
    if (html && iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
      }
    }
  }, [html]);

  const handlePrint = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.print();
    }
  };

  const handleDownload = () => {
    if (iframeRef.current?.contentDocument) {
      const content = iframeRef.current.contentDocument.documentElement.outerHTML;
      const blob = new Blob([`<!DOCTYPE html>${content}`], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `facture-${orderId}.html`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#7126b6]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">{error}</h3>
          <Link href="/account/purchases" className="mt-4 inline-block text-[#7126b6] hover:underline">
            Retour aux achats
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/account/purchases"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#7126b6]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux achats
        </Link>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-lg bg-[#7126b6] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#5a1d94]"
          >
            <Printer className="h-4 w-4" />
            Imprimer
          </button>
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Télécharger
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <iframe
          ref={iframeRef}
          className="h-[800px] w-full border-0"
          title="Facture"
        />
      </div>
    </div>
  );
}
