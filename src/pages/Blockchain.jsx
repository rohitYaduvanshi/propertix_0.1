// src/pages/Blockchain.jsx
import { useState } from "react";
import { BrowserProvider, Contract, id as keccak256 } from "ethers";
import {
  PROPERTY_REGISTRY_ADDRESS,
  PROPERTY_REGISTRY_ABI,
} from "../blockchain/contractConfig.js";
import { useAuth } from "../context/AuthContext.jsx";
import { generatePropertyCertificate } from "../utils/generateCertificate.js";

const Blockchain = () => {
  const { isWalletConnected } = useAuth();

  const [ownerName, setOwnerName] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [area, setArea] = useState("");
  const [propertyType, setPropertyType] = useState("Residential");
  const [priceUsd, setPriceUsd] = useState("");
  const [description, setDescription] = useState("");
  const [additionalDetails, setAdditionalDetails] = useState("");

  const [images, setImages] = useState([]); // max 3
  const [documents, setDocuments] = useState([]);

  const [status, setStatus] = useState(null);
  const [hash, setHash] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [certificateUrl, setCertificateUrl] = useState(null);

  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files || []);
    setImages(files.slice(0, 3)); // exactly/max 3
  };

  const handleDocumentsChange = (e) => {
    const files = Array.from(e.target.files || []);
    setDocuments(files);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setStatus(null);
    setCertificateUrl(null);

    if (!isWalletConnected) {
      setStatus("Please connect your wallet before registering a property.");
      return;
    }

    if (images.length !== 3) {
      setStatus("Please upload exactly 3 property images.");
      return;
    }

    try {
      setIsSubmitting(true);

      // 1) Metadata + hash
      const metadata = {
        ownerName: ownerName.trim(),
        propertyAddress: propertyAddress.trim(),
        area: area.trim(),
        propertyType: propertyType.trim(),
        priceUsd: priceUsd.trim(),
        description: description.trim(),
        additionalDetails: additionalDetails.trim(),
        imageNames: images.map((f) => f.name),
        documentNames: documents.map((f) => f.name),
        createdAt: new Date().toISOString(),
      };
      const metadataString = JSON.stringify(metadata);
      const propertyHash = keccak256(metadataString);
      setHash(propertyHash);

      // 2) Contract tx
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const network = await provider.getNetwork();
      if (network.chainId !== 31337n) {
        setStatus("Please switch MetaMask to Hardhat Local (chainId 31337).");
        setIsSubmitting(false);
        return;
      }

      const contract = new Contract(
        PROPERTY_REGISTRY_ADDRESS,
        PROPERTY_REGISTRY_ABI,
        signer
      );

      setStatus("Sending transaction to register property on-chain...");
      const tx = await contract.addProperty(propertyHash);

      setStatus("Transaction sent. Waiting for confirmation...");
      await tx.wait();

      setStatus("✅ Property registered on blockchain.");

      // 3) Certificate
      try {
        const pdfBytes = await generatePropertyCertificate({
          ownerName,
          propertyAddress,
          propertyType,
          area,
          priceUsd,
          hash: propertyHash,
        });

        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        setCertificateUrl(url);
      } catch (err) {
        console.error("Certificate generation failed", err);
        setStatus(
          "✅ Property registered. (Certificate generation failed, please try again.)"
        );
      }
    } catch (err) {
      console.error(err);
      setStatus("❌ Registration failed (transaction error).");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative flex items-center justify-center px-8 py-16 overflow-hidden">
      {/* background glow hero style */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-cyan-700/30 blur-3xl" />
        <div className="absolute left-10 top-10 h-72 w-72 border border-cyan-500/40 rounded-[40px] -rotate-6 opacity-40" />
      </div>

      <div className="relative max-w-5xl w-full grid md:grid-cols-2 gap-12 items-start">
        {/* LEFT: hero text */}
        <div className="space-y-4">
          <p className="text-sm font-semibold tracking-[0.2em] text-cyan-400">
            REGISTER ON‑CHAIN
          </p>
          <h1 className="text-3xl md:text-4xl font-bold">
            Register a new
            <span className="block text-cyan-400">verified property record</span>
          </h1>
          <p className="text-gray-300 text-sm md:text-base">
            Use this page to submit official property details and anchor a
            unique verification hash on the blockchain.
          </p>

          {!isWalletConnected && (
            <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-100">
              Connect your wallet before submitting so the property can be
              registered on‑chain.
            </div>
          )}

          {hash && (
            <div className="mt-4 text-[11px] text-cyan-300 break-all bg-black/60 border border-cyan-500/30 rounded-xl px-3 py-2">
              <span className="block text-[10px] uppercase tracking-wide text-cyan-400/80 mb-1">
                Latest generated hash
              </span>
              {hash}
            </div>
          )}

          {certificateUrl && (
            <a
              href={certificateUrl}
              download={`Propertix_Certificate_${ownerName || "property"}.pdf`}
              className="inline-block mt-4 px-4 py-2 rounded-full bg-cyan-500 text-black text-xs font-semibold shadow-lg shadow-cyan-500/40"
            >
              Download certificate
            </a>
          )}
        </div>

        {/* RIGHT: form card */}
        <div className="relative">
          <div className="rounded-2xl bg-black/60 border border-white/10 p-6 max-h-[80vh] overflow-y-auto shadow-xl shadow-cyan-900/40">
            <h2 className="text-lg font-semibold mb-1">
              Property registration form
            </h2>
            <p className="text-[11px] text-gray-400 mb-4">
              All required fields must be filled. Hash is generated from form
              data and sent to blockchain.
            </p>

            <form onSubmit={handleRegister} className="space-y-4">
              {/* Owner + type */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-300 mb-1">
                    Owner name *
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    required
                    className="w-full rounded-lg bg-zinc-900/80 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-300 mb-1">
                    Property type *
                  </label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full rounded-lg bg-zinc-900/80 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option>Residential</option>
                    <option>Commercial</option>
                    <option>Plot</option>
                    <option>Apartment</option>
                  </select>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs text-gray-300 mb-1">
                  Property address / location *
                </label>
                <input
                  type="text"
                  value={propertyAddress}
                  onChange={(e) => setPropertyAddress(e.target.value)}
                  required
                  className="w-full rounded-lg bg-zinc-900/80 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* Area + price */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-300 mb-1">
                    Area / size (sq ft) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    required
                    className="w-full rounded-lg bg-zinc-900/80 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-300 mb-1">
                    Price (USD) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={priceUsd}
                    onChange={(e) => setPriceUsd(e.target.value)}
                    required
                    className="w-full rounded-lg bg-zinc-900/80 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs text-gray-300 mb-1">
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={3}
                  className="w-full rounded-lg bg-zinc-900/80 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                  placeholder="Beautiful 3-bedroom house with modern amenities..."
                />
              </div>

              {/* Property images (exactly 3) */}
              <div>
                <label className="block text-xs text-gray-300 mb-1">
                  Property images (exactly 3 required)
                </label>

                <div
                  className="border border-dashed border-zinc-600 rounded-xl bg-zinc-900/60 px-4 py-4 text-center cursor-pointer hover:border-cyan-500 transition"
                  onClick={() =>
                    document.getElementById("property-images-input").click()
                  }
                >
                  <input
                    id="property-images-input"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImagesChange}
                    className="hidden"
                  />

                  <p className="text-xs text-gray-200 font-medium mb-1">
                    Choose Files
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Drop images or click to upload ({images.length}/3). PNG, JPG,
                    GIF up to 10MB each.
                  </p>
                </div>

                {images.length > 0 && (
                  <ul className="mt-2 text-[11px] text-gray-400 text-left list-disc list-inside space-y-1">
                    {images.map((file, idx) => (
                      <li key={idx}>{file.name}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Documents upload */}
              {/* Documents upload */}
              <div>
                <label className="block text-xs text-gray-300 mb-1">
                  Supporting documents (PDF / images)
                </label>

                <div
                  className="border border-dashed border-zinc-600 rounded-xl bg-zinc-900/60 px-4 py-4 text-center cursor-pointer hover:border-cyan-500 transition"
                  onClick={() =>
                    document.getElementById("property-docs-input").click()
                  }
                >
                  <input
                    id="property-docs-input"
                    type="file"
                    accept=".pdf,image/*"
                    multiple
                    onChange={handleDocumentsChange}
                    className="hidden"
                  />

                  <p className="text-xs text-gray-200 font-medium mb-1">
                    Choose Files
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Upload sale deed, ID proof, tax receipts, etc. (PDF, PNG, JPG).
                  </p>
                </div>

                {documents.length > 0 && (
                  <ul className="mt-2 text-[11px] text-gray-400 text-left list-disc list-inside space-y-1">
                    {documents.map((file, idx) => (
                      <li key={idx}>{file.name}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Additional details */}
              <div>
                <label className="block text-xs text-gray-300 mb-1">
                  Additional details (optional)
                </label>
                <textarea
                  value={additionalDetails}
                  onChange={(e) => setAdditionalDetails(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg bg-zinc-900/80 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                  placeholder="Maintenance notes, sale status, etc."
                />
              </div>

              {/* Actions + status */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 px-6 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-700 disabled:cursor-not-allowed text-black text-sm font-semibold shadow-lg shadow-emerald-500/40 transition-all"
              >
                {isSubmitting ? "Registering..." : "Create Property"}
              </button>

              {status && (
                <p className="mt-3 text-xs text-gray-200">{status}</p>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Blockchain;
