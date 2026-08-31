import json, struct, glob

for path in glob.glob(r'C:\Users\rxhmx\.gemini\antigravity\scratch\3d-customizer\assets\models\*.glb'):
    with open(path, 'rb') as f:
        magic, version, length = struct.unpack('<4sII', f.read(12))
        chunk_length, chunk_type = struct.unpack('<II', f.read(8))
        data = json.loads(f.read(chunk_length).decode('utf-8'))
        name = path.split('\\')[-1]
        print(f"\n=================== {name} ===================")
        min_all = [float('inf'), float('inf'), float('inf')]
        max_all = [float('-inf'), float('-inf'), float('-inf')]
        for acc in data.get('accessors', []):
            if acc.get('type') == 'VEC3' and 'min' in acc and 'max' in acc:
                for j in range(3):
                    min_all[j] = min(min_all[j], acc['min'][j])
                    max_all[j] = max(max_all[j], acc['max'][j])
        print("Total Bounds:")
        print(f"  X: {min_all[0]:.2f} to {max_all[0]:.2f} (size={max_all[0]-min_all[0]:.2f})")
        print(f"  Y: {min_all[1]:.2f} to {max_all[1]:.2f} (size={max_all[1]-min_all[1]:.2f})")
        print(f"  Z: {min_all[2]:.2f} to {max_all[2]:.2f} (size={max_all[2]-min_all[2]:.2f})")
        
        # Print top nodes
        print("Nodes:")
        for n in data.get('nodes', []):
            mesh_idx = n.get('mesh')
            print(f"  Node: '{n.get('name')}' -> mesh={mesh_idx}, children={n.get('children')}")
