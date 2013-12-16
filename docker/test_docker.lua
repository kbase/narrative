PROXY=nil
d = require('docker')
p=require('pl.pretty')
comp = require('pl.comprehension').new()

c=d.config()
c.image='sychan/narrative:latest'
c.Cmd={'test_narrative'}
c.PortSpecs= { "8888" }
c.name="test_narrative"
--p.dump(d.client:containers())
res = d.client:create_container{ payload = c, name = "test_narrative"}
--p.dump(res.body)
id = res.body.Id
print("Container id = ", id)
res = d.client:start_container{ id = id, payload = { PublishAllPorts = true }}
if (res.status == 204) then
   print("Container started successfully")
else
   print("Container failed to start")
   p.dump( res.body)
end
res = d.client:containers()
--p.dump(res.body)
print "Listing of ports in containers"
portmap = {}
for index,container in pairs(res.body) do
   name = string.sub(container.Names[1],2,-1)
   p.dump( name)
   portmap[name]={}
   for i, v in pairs(container.Ports) do
      portmap[name][v.PublicPort] = v.PrivatePort
   end
end
p.dump(portmap)
p.dump(d.client:top{id=id,ps_args="auxww"}.body)
res = d.client:stop_container{ id = id}
if (res.status == 204) then
   print("Container stopped successfully")
else
   print("Container failed to stop")
   p.dump( res.body)
end
res = d.client:remove_container{ id = id}
if (res.status == 204) then
   print("Container removed successfully")
else
   print("Container failed delete")
   p.dump( res.body)
end
