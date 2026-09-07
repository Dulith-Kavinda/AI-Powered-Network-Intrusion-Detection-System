import pandas as pd
import glob

csv_files = glob.glob("D:/dulith_doc/peojects/AI_NIDS/MachineLearningCVE/*.csv")

# Read and concatenate
df_list = []
total_files = len(csv_files)
for file in csv_files:
    current_index = len(df_list) + 1
    print(f"\rReading {current_index}/{total_files}: {file}...", end="", flush=True)
    df_list.append(pd.read_csv(file))

print()
    
combined_df = pd.concat(df_list, ignore_index=True)
combined_df.to_csv("combined_dataset.csv", index=False)
print("Combined dataset shape:", combined_df.shape)
