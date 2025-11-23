// Set transaction when deed is created
export const setTransactionWhenDeedCreated = async (deedId, ownerWalletAddress, hash, amount = 0) => {
  const tnxServiceUrl = process.env.TNX_MICROSERVICE_URL || "http://localhost:5004/api/transactions";

  console.log("Transaction Service URL:", tnxServiceUrl);
  console.log("Request payload:", { deedId, ownerWalletAddress, hash, amount });

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
      let errorMessage = `Failed to set transaction: ${response.status} ${response.statusText}`;
      try {
        const errorBody = await response.text();
        if (errorBody) {
          errorMessage += ` - ${errorBody}`;
          console.error("Error response body:", errorBody);
        }
      } catch (parseError) {
        console.error("Could not parse error response body");
      }
      console.error("Response status:", response.status);
      console.error("Response headers:", Object.fromEntries(response.headers.entries()));
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("Transaction set successfully:", data);
    return data;
  } catch (error) {
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      console.error("Network error - Transaction service may be unreachable:", error.message);
      throw new Error(`Transaction service unreachable at ${tnxServiceUrl}. Please check if the service is running.`);
    }
    console.error("Error setting transaction:", error);
    throw error;
  }
};

// Set transaction for a full deed direct transaction
export const fullDeedDirectTransaction = async (deedId, fromAddress, toAddress, hash, amount) => {
  const tnxServiceUrl = process.env.TNX_MICROSERVICE_URL || "http://localhost:5004/api/transactions";

  console.log("Transaction Service URL:", tnxServiceUrl);
  console.log("Request payload:", { deedId, fromAddress, toAddress, hash, amount });

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
      let errorMessage = `Failed to set full deed transaction: ${response.status} ${response.statusText}`;
      try {
        const errorBody = await response.text();
        if (errorBody) {
          errorMessage += ` - ${errorBody}`;
          console.error("Error response body:", errorBody);
        }
      } catch (parseError) {
        console.error("Could not parse error response body");
      }
      console.error("Response status:", response.status);
      console.error("Response headers:", Object.fromEntries(response.headers.entries()));
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("Full deed transaction set successfully:", data);
    return data;
  } catch (error) {
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      console.error("Network error - Transaction service may be unreachable:", error.message);
      throw new Error(`Transaction service unreachable at ${tnxServiceUrl}. Please check if the service is running.`);
    }
    console.error("Error setting full deed transaction:", error);
    throw error;
  }
};
