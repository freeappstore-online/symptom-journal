import json, struct
def glb(path, parts):
 data=bytearray();views=[];access=[];meshes=[];nodes=[]
 for name,vs,fs in parts:
  used=sorted({i for f in fs for i in f});mapping={v:i for i,v in enumerate(used)};pos=[vs[i] for i in used];idx=[mapping[i] for f in fs for i in f]
  def add(blob,target):
   while len(data)%4:data.append(0)
   off=len(data);data.extend(blob);views.append({'buffer':0,'byteOffset':off,'byteLength':len(blob),'target':target});return len(views)-1
  pv=add(struct.pack('<'+'f'*len(pos)*3,*[n for v in pos for n in v]),34962)
  access.append({'bufferView':pv,'componentType':5126,'count':len(pos),'type':'VEC3','min':[min(v[k] for v in pos) for k in range(3)],'max':[max(v[k] for v in pos) for k in range(3)]});pa=len(access)-1
  iv=add(struct.pack('<'+'I'*len(idx),*idx),34963)
  access.append({'bufferView':iv,'componentType':5125,'count':len(idx),'type':'SCALAR'});ia=len(access)-1
  meshes.append({'name':name,'primitives':[{'attributes':{'POSITION':pa},'indices':ia}]});nodes.append({'name':name,'mesh':len(meshes)-1})
 while len(data)%4:data.append(0)
 doc={'asset':{'version':'2.0','generator':'SymptomMap source-preserving anatomy conversion'},'buffers':[{'byteLength':len(data)}],'bufferViews':views,'accessors':access,'meshes':meshes,'nodes':nodes,'scenes':[{'nodes':list(range(len(nodes)))}],'scene':0}
 js=json.dumps(doc,separators=(',',':')).encode();js+=b' '*((-len(js))%4)
 path.write_bytes(struct.pack('<III',0x46546c67,2,28+len(js)+len(data))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(data),0x004e4942)+data)
