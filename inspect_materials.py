import json, struct, glob

for path in glob.glob(r'C:\Users\rxhmx\.gemini\antigravity\scratch\3d-customizer\assets\models\*.glb'):
    with open(path, 'rb') as f:
        magic, version, length = struct.unpack('<4sII', f.read(12))
        chunk_length, chunk_type = struct.unpack('<II', f.read(8))
        data = json.loads(f.read(chunk_length).decode('utf-8'))
        name = path.split('\\')[-1]
        print(f"\n=================== {name} ===================")
        mats = data.get('materials', [])
        print(f"Materials count: {len(mats)}")
        for i, m in enumerate(mats):
            pbr = m.get('pbrMetallicRoughness', {})
            color = pbr.get('baseColorFactor', [1,1,1,1])
            print(f"  Mat {i}: '{m.get('name')}' -> color: {[round(c, 2) for c in color]}, metal={pbr.get('metallicFactor')}, rough={pbr.get('roughnessFactor')}")
