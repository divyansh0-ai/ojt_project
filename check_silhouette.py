# Standalone script to check silhouette score for KMeans clustering
# Not part of the main project — safe to delete

from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score

from src.preprocessing import load_and_clean_data
from src.rfm import compute_rfm

# Load and prepare data
df = load_and_clean_data()
rfm = compute_rfm(df)

# Scale RFM values
scaler = StandardScaler()
rfm_scaled = scaler.fit_transform(rfm[["Recency", "Frequency", "Monetary"]])

# Test different cluster counts
print("Silhouette Scores:")
print("-" * 30)
for k in range(2, 8):
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    labels = kmeans.fit_predict(rfm_scaled)
    score = silhouette_score(rfm_scaled, labels)
    print(f"  k={k}  →  {score:.4f}")
