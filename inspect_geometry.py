import json, struct, glob

for path in glob.glob(r'C:\Users\rxhmx\.gemini\antigravity\scratch\3d-customizer\assets\models\*.glb'):
    with open(path, 'rb') as f:
        magic, version, length = struct.unpack('<4sII', f.read(12))
        chunk_length, chunk_type = struct.unpack('<II', f.read(8))
        data = json.loads(f.read(chunk_length).decode('utf-8'))
        print(f"\n=================== {path.split('\\')[-1]} ({length} bytes) ===================")
        
        for n_idx, node in enumerate(data.get('nodes', [])):
            mesh_idx = node.get('mesh')
            if mesh_idx is not None:
                mesh = data['meshes'][mesh_idx]
                prim = mesh['primitives'][0]
                pos_acc = data['accessors'][prim['attributes']['POSITION']]
                p_min = [round(x, 2) for x in pos_acc.get('min', [])]
                p_max = [round(x, 2) for x in pos_acc.get('max', [])]
                dim = [round(p_max[j] - p_min[j], 2) for j in range(3)]
                print(f"Node {n_idx:2d} '{node.get('name')}': {pos_acc.get('count')} verts | min={p_min} max={p_max} size={dim}")
