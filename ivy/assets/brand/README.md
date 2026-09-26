# Brand files

The render uses whatever is here. To update, replace the files and run `tools/build.sh`:

| File | Used for |
| --- | --- |
| `logo.png` (or `.svg`) | The IVY wordmark on a transparent background. It's used as an alpha mask, cropped to its glyphs, and recoloured per context: the sidebar, the iPhone, and the end-card lockup. |
| `app-icon.png` (or `.svg`) | The square app icon. It's used for Ivy's chat avatar and the composer. It's also measured (field colour and wordmark position), so the window can collapse into an exact rebuild of it. |
| `brand.json` | Optional palette override, for example `{"palette": {"leaf": "#45BF7C"}}`. The keys are the ones in `PALETTE` in `src/config.js`. |

The page checks for these files each time it loads.
