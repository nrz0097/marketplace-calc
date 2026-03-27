import json

file_path = r'c:\Users\USER\Desktop\KALKULATOR HARGA ONLINE\kalkulator-harga-backup-2026-03-27.json'

with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

updated_count = 0
if 'products' in data:
    for item in data['products']:
        if item.get('platform', '').lower() == 'tiktok':
            fees = item.get('platformFees', [])
            for fee in fees:
                if fee.get('nama') == 'Komisi Kategori':
                    fee['persen'] = 10
                    updated_count += 1
                elif fee.get('nama') == 'Program XBP':
                    fee['maksimalRp'] = 60000
                    updated_count += 1

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2)

print(f"Berhasil memperbarui {updated_count} entri biaya pada platform Tiktok di file JSON.")
