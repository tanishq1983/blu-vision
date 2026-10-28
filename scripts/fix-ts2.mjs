import fs from 'node:fs';
const p = 'C:/Users/tanis/blu-visual-teacher/server/index.ts';
let c = fs.readFileSync(p, 'utf8');
const a = "    } catch (e: any) { setJob(jobId, { status: 'failed', error: e.message }); res.status(500).json({ error: e.message }); }\r\n});";
const b = "    } catch (e: any) { setJob(jobId, { status: 'failed', error: e.message }); res.status(500).json({ error: e.message }); }\r\n    } catch (e: any) { setJob(jobId, { status: 'failed', error: e.message }); res.status(500).json({ error: e.message }); }\r\n});";
if (c.includes(a) && !c.includes(b)) {
  c = c.replace(a, b);
  fs.writeFileSync(p, c, 'utf8');
  console.log('fixed');
} else {
  console.log('state:', c.includes(a), c.includes(b));
}