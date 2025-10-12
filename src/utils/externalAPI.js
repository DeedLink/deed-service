// Set transaction when deed is created
export const setTransactionWhenDeedCreated = async (deedId, ownerWalletAddress, hash, amount = 0) => {
  const tnxServiceUrl = process.env.TNX_MICROSERVICE_URL || "http://localhost:5004/api/transactions";

  console.log("Transaction Service URL:", tnxServiceUrl);

  try {
    const response = await fetch(tnxServiceUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deedId,
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

// Set transaction for a full deed direct transaction
export const fullDeedDirectTransaction = async (deedId, fromAddress, toAddress, hash, amount) => {
  const tnxServiceUrl = process.env.TNX_MICROSERVICE_URL || "http://localhost:5004/api/transactions";

  console.log("Transaction Service URL:", tnxServiceUrl);

  try {
    const response = await fetch(tnxServiceUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deedId,
        from: fromAddress,
        to: toAddress,
        hash: hash || `hash_${Date.now()}`,
        amount,
        type: "full_transfer",
        description: `Full deed transfer from ${fromAddress} to ${toAddress}.`,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to set full deed transaction: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Full deed transaction set successfully:", data);
    return data;
  } catch (error) {
    console.error("Error setting full deed transaction:", error);
    throw error;
  }
};
