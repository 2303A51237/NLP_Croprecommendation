# NLP-Based Crop Recommendation from Farmer Narratives

A student-project prototype with an English narrative analyzer, an editable measurement review step, and a Random Forest crop ranking API. It does not infer missing measurements, and it does not return recommendations until a trained model and all seven validated inputs are available.

## Dataset status

The project workspace currently has an **empty** `datasets/crop_recommendation.csv`; no crop data or trained model was present during implementation. The training code intentionally stops with a clear error until you provide your crop dataset. No crop labels, sample measurements, model output, or accuracy have been fabricated. Once you provide the dataset, inspect its real header and rows before running training. Supported column names are normalized variants of `N`, `P`, `K`, `temperature`, `humidity`, `ph`, `rainfall`, and `label` (or `crop`). If your actual columns differ, update the alias map in `backend/train_model.py` after inspection.

`datasets/farmer_narratives.csv` contains a few explicitly marked **synthetic, unvalidated examples** to demonstrate the requested schema. It is not real farmer data and is not used to train the crop classifier. The NLP module currently uses conservative English tokenization and keyword/number rules; Telugu interface strings are translated, but Telugu narrative extraction is not implemented.

## Requirements

- Windows 10/11 and PowerShell
- Python 3.10 or newer
- Node.js 18 or newer (includes npm)
- The genuine crop recommendation CSV supplied by the project owner

## Setup

Open PowerShell in the project root (the folder containing this README).

### 1. Install backend dependencies

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r backend\requirements.txt
```

If PowerShell blocks environment activation, use `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` in that terminal, then activate again. Alternatively, call `.\.venv\Scripts\python.exe` directly in the commands below.

### 2. Add and train with the crop dataset

Replace the empty `datasets\crop_recommendation.csv` with your supplied file, preserving that path. Inspect the header and data first. Then, from the project root with the virtual environment active:

```powershell
python backend\train_model.py
```

The script validates columns and values, drops rows that lack a valid label or one of the seven numeric inputs, performs a held-out evaluation, prints the measured report, and writes `models\crop_recommendation.joblib`. It reports accuracy only from that actual split. A small or imbalanced source dataset can make the evaluation less reliable; retain the printed sample counts when presenting results.

### 3. Run the Flask API

In a PowerShell terminal from the project root with the virtual environment active:

```powershell
python backend\app.py
```

The API listens on `http://127.0.0.1:5000`. Check `http://127.0.0.1:5000/api/health` to verify it is running.

### 4. Run the React app

Open a second PowerShell terminal:

```powershell
Set-Location frontend
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://127.0.0.1:5173`). The frontend calls the Flask API at `http://127.0.0.1:5000` by default. To use another API address, create `frontend/.env.local` with:

```text
VITE_API_BASE_URL=http://127.0.0.1:5000
```

Restart Vite after changing environment variables.

## API

- `GET /api/health` — backend status.
- `POST /api/analyze` — JSON `{ "description": "...", "language": "en" }`. Returns only values explicitly recognized in the narrative and a list of missing measurements. The optional `language` value affects no backend NLP behavior.
- `POST /api/recommend` — JSON `{ "values": { "nitrogen": 80, "phosphorus": 40, "potassium": 35, "temperature": 26, "humidity": 70, "ph": 6.5, "rainfall": 620 } }`. Requires all seven values and a trained artifact. Returns the top crop classes and Random Forest tree vote shares.

Vote share is not a calibrated probability or yield guarantee. Validate any result with local agricultural guidance. The interface requires farmer confirmation of all seven measurements before sending a recommendation request.

## Project layout

```text
backend/       Flask API, NLP extraction, model training and prediction
frontend/      React + Vite responsive interface
datasets/      Crop dataset location and synthetic narrative schema examples
models/        Generated model artifact (created by training)
```
