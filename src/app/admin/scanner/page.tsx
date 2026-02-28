"use client";

import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function AdminScannerPage() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationData, setVerificationData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize QR Code Scanner
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false,
    );

    const onScanSuccess = async (decodedText: string) => {
      // Decode URL to extract ID
      try {
        scanner.pause();
        setScanResult(decodedText);
        setError(null);

        let uniqueId = decodedText;
        if (decodedText.includes("id=")) {
          const url = new URL(decodedText);
          uniqueId = url.searchParams.get("id") || decodedText;
        }

        setIsVerifying(true);
        const res = await fetch(
          `/api/admin/verify-registration?id=${uniqueId}`,
        );
        const data = await res.json();

        if (data.success) {
          setVerificationData(data.user);
        } else {
          setError(data.error || "Failed to verify registration");
          setVerificationData(null);
        }
      } catch (err: any) {
        setError("Invalid QR Code format");
      } finally {
        setIsVerifying(false);
      }
    };

    const onScanError = (err: any) => {
      // ignore
    };

    scanner.render(onScanSuccess, onScanError);

    return () => {
      scanner.clear().catch(console.error);
    };
  }, []);

  const handleReset = () => {
    setScanResult(null);
    setVerificationData(null);
    setError(null);
    // Reload to re-init scanner easily
    window.location.reload();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Admin QR Scanner</h1>

      {!scanResult ? (
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div id="reader" className="w-full max-w-md mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
            <h2 className="text-xl font-semibold">Scan Result</h2>

            {isVerifying ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Verifying Registration...</span>
              </div>
            ) : verificationData ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
                  <CheckCircle className="w-6 h-6" />
                  <span className="font-medium">Registration Verified</span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 block mb-1">
                      Registration ID
                    </span>
                    <span className="font-medium bg-gray-100 px-2 py-1 rounded">
                      {verificationData.uniqueId}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-1">Name</span>
                    <span className="font-medium">
                      {verificationData.title} {verificationData.fullName}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-1">Email</span>
                    <span className="font-medium">
                      {verificationData.email}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-1">Phone</span>
                    <span className="font-medium">
                      {verificationData.phoneNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-1">Church</span>
                    <span className="font-medium">
                      {verificationData.churchDetails}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-1">Attendance</span>
                    <span className="font-medium capitalize">
                      {verificationData.attendanceType}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                <XCircle className="w-6 h-6" />
                <span className="font-medium">
                  {error || "Verification Failed"}
                </span>
              </div>
            )}

            <button
              onClick={handleReset}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Scan Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
