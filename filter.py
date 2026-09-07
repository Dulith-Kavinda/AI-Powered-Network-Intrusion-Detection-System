import pandas as pd

print("="*10+" Wait... "+"="*10+"\n")
df = pd.read_csv("D:/dulith_doc/peojects/AI_NIDS/combined_dataset.csv")
benign_df = df[df['Label'] == 'BENIGN']

# Save filtered data if needed
benign_df.to_csv("benign_only.csv", index=False)
print("="*10+" Done "+"="*10+"\n")
print("Filtered dataset shape:", benign_df.shape)
