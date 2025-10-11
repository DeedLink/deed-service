export const setTransactionWhenDeedCreated = async (deedId, ownerWalletAddress, hash, amount = 0) => {
  const tnxServiceUrl = process.env.TNX_MICROSERVICE_URL || "http://localhost:5004";

  console.log("Transaction Service URL:", tnxServiceUrl);

  try {
    const response = await fetch(tnxServiceUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "system",
        to: ownerWalletAddress,
        hash: hash || `hash_${Date.now()}`,
        amount,
        type: "init",
        description: `Deed with ID ${deedId} has been created.`,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to set transaction: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Transaction set successfully:", data);
    return data;
  } catch (error) {
    console.error("Error setting transaction:", error);
    throw error;
  }
};
