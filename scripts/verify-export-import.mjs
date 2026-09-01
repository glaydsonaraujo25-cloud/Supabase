import { createServer } from 'vite'
import { spawnSync } from 'node:child_process'
const server=await createServer({optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true}})
try {
 const {csv,tasksIcs}=await server.ssrLoadModule('/src/lib/exports.ts')
 const title='Revisão; "segurança"\n'+ 'ç🙂'.repeat(40)
 const input={csv:csv([['Título','Horas'],[title,2],['=1+1',3]]),ics:tasksIcs([{id:'fixture-1',title,due_date:'2024-02-29',status:'pending'}],new Date('2025-01-01T12:00:00Z')),title}
 const result=spawnSync(process.env.PYTHON??'python',['scripts/verify-export-import.py'],{input:JSON.stringify(input),encoding:'utf8'})
 process.stdout.write(result.stdout??'');process.stderr.write(result.stderr??'')
 if(result.error)throw result.error
 process.exitCode=result.status??1
}finally{await server.close()}
