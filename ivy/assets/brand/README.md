# Official brand files go here

The spot renders with stand-ins until these exist. Drop them in and run `tools/build.sh`:

| File | Used for |
| --- | --- |
| `logo.svg` or `logo.png` | Wordmark on a transparent background. Appears in the sidebar, on the iPhone, and as the end-card lockup. If it's dark, it's reversed to white on the green end card automatically. |
| `app-icon.svg` or `app-icon.png` | Square app icon (1024×1024 is ideal). The window collapses into it, and Ivy's chat avatar uses it. |
| `brand.json` | Optional palette override, for example `{"palette": {"ivy700": "#0F3D2C", "ivy500": "#1F7352", "paper": "#F3F1EA"}}`. The keys are the ones in `PALETTE` in `src/config.js`. |

Nothing else needs to change. The page checks for these files each time it loads.
