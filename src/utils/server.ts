import express, { Request, Response } from 'express';
import { Graph } from '@graphprotocol/grc-20';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const app = express();
const port = 3000;

const PERMITS_SPACE_ID = 'XPZ8fnf3DvNMRDbFgxEZi2';
const DEEDS_SPACE_ID = 'P77ioa8U9EipVASzVHBA9B';

// Serve static files
app.use(express.static('public'));

// API endpoints
app.get('/api/permits', async (req: Request, res: Response) => {
  try {
    const data = JSON.parse(fs.readFileSync('./data/permits-triples.json', 'utf8'));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load permits data' });
  }
});

app.get('/api/deeds', async (req: Request, res: Response) => {
  try {
    const data = JSON.parse(fs.readFileSync('./data/deeds-triples.json', 'utf8'));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load deeds data' });
  }
});

// Serve HTML
app.get('/', (_req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Pinellas County Data Explorer</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 0;
          background: #0f0f0f;
          color: #ffffff;
        }
        .container { 
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          display: flex;
          align-items: center;
          margin-bottom: 40px;
          padding: 20px;
          background: #1a1a1a;
          border-radius: 8px;
        }
        .space {
          margin-bottom: 40px;
          background: #1a1a1a;
          border-radius: 8px;
          padding: 20px;
        }
        .space-header {
          display: flex;
          align-items: center;
          margin-bottom: 20px;
        }
        .space-id {
          color: #888;
          font-size: 14px;
          margin-top: 8px;
        }
        .record {
          background: #2a2a2a;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }
        .record-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid #333;
        }
        .attribute {
          display: flex;
          margin-bottom: 12px;
          padding: 8px;
          background: #333;
          border-radius: 4px;
        }
        .attribute-id {
          width: 150px;
          color: #888;
        }
        .attribute-value {
          flex: 1;
        }
        h1, h2 { 
          color: #ffffff;
          margin: 0;
        }
        .tab-container {
          display: flex;
          margin-bottom: 20px;
        }
        .tab {
          padding: 10px 20px;
          background: #2a2a2a;
          border: none;
          color: #fff;
          cursor: pointer;
          margin-right: 10px;
          border-radius: 4px;
        }
        .tab.active {
          background: #4a4a4a;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Pinellas County Data Explorer</h1>
        </div>
        
        <div class="tab-container">
          <button class="tab active" onclick="showSpace('permits')">Permits</button>
          <button class="tab" onclick="showSpace('deeds')">Deeds</button>
        </div>

        <div id="permits-space" class="space">
          <div class="space-header">
            <div>
              <h2>Building Permits</h2>
              <div class="space-id">${PERMITS_SPACE_ID}</div>
            </div>
          </div>
          <div id="permits"></div>
        </div>

        <div id="deeds-space" class="space" style="display: none;">
          <div class="space-header">
            <div>
              <h2>Property Deeds</h2>
              <div class="space-id">${DEEDS_SPACE_ID}</div>
            </div>
          </div>
          <div id="deeds"></div>
        </div>
      </div>

      <script>
        function showSpace(spaceType) {
          document.getElementById('permits-space').style.display = spaceType === 'permits' ? 'block' : 'none';
          document.getElementById('deeds-space').style.display = spaceType === 'deeds' ? 'block' : 'none';
          
          // Update tab styles
          document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
          });
          event.target.classList.add('active');
        }

        function renderRecord(record) {
          const recordDiv = document.createElement('div');
          recordDiv.className = 'record';
          
          const header = document.createElement('div');
          header.className = 'record-header';
          header.innerHTML = \`
            <h3>Entity: \${record.entityId}</h3>
          \`;
          recordDiv.appendChild(header);

          const attributes = document.createElement('div');
          record.triples.forEach(triple => {
            const attr = document.createElement('div');
            attr.className = 'attribute';
            attr.innerHTML = \`
              <div class="attribute-id">\${triple.attributeId}</div>
              <div class="attribute-value">\${triple.value.value}</div>
            \`;
            attributes.appendChild(attr);
          });
          recordDiv.appendChild(attributes);

          return recordDiv;
        }

        async function loadData() {
          // Load permits
          const permitsResponse = await fetch('/api/permits');
          const permitsData = await permitsResponse.json();
          const permitsContainer = document.getElementById('permits');
          permitsData.forEach(record => {
            permitsContainer.appendChild(renderRecord(record));
          });

          // Load deeds
          const deedsResponse = await fetch('/api/deeds');
          const deedsData = await deedsResponse.json();
          const deedsContainer = document.getElementById('deeds');
          deedsData.forEach(record => {
            deedsContainer.appendChild(renderRecord(record));
          });
        }

        loadData();
      </script>
    </body>
    </html>
  `);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
