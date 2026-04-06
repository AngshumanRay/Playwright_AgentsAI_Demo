// =============================================================================
// utils/helpers/screencast-helper.ts — PLAYWRIGHT 1.59 SCREENCAST API HELPER
// =============================================================================
// PURPOSE:
//   This utility wraps Playwright 1.59's new Screencast API to provide
//   automatic video recording of test executions with rich visual annotations.
//
// WHAT IS SCREENCAST?
//   Screencast is a new API in Playwright 1.59 that lets you record the browser
//   screen as a video file (.webm). Unlike the older video recording option,
//   Screencast provides:
//
//     🎬 Action Annotations — Every click, fill, navigation is shown on-screen
//     📖 Chapter Cards      — Title cards with blur effect at key test steps
//     🏷️  Custom Overlays    — Sticky HTML overlays for branding/status display
//     📸 Real-Time Frames   — Callback for each video frame (JPEG) as it's captured
//     🎥 Video Receipts     — Complete visual evidence of every test execution
//
// WHY IS THIS IMPORTANT FOR AGENTIC AI?
//   When an AI agent runs tests autonomously, the human team needs visual proof
//   of what happened. Screencast creates "video receipts" — complete recordings
//   showing exactly what the browser did, with action labels, chapter titles,
//   and custom overlays. This is the cornerstone of agentic transparency.
//
// PLAYWRIGHT 1.59 SCREENCAST API METHODS:
//   page.screencast.start({ path, quality, size, onFrame })
//   page.screencast.stop()
//   page.screencast.showActions({ position })       — action annotation layer
//   page.screencast.showChapter(title, { description, duration })
//   page.screencast.showOverlay(html, { duration })  — returns disposable
//   page.screencast.hideOverlays()
//   start() onFrame callback: ({ data: Buffer }) => void — real-time JPEG frames
//
// CONFIGURATION (.env):
//   SCREENCAST_ENABLED=true             — Master toggle for screencast recording
//   SCREENCAST_SHOW_ACTIONS=true        — Show action annotations on video
//   SCREENCAST_SHOW_CHAPTERS=true       — Show chapter title cards at key steps
//   SCREENCAST_QUALITY=80               — Video quality 0–100 (default 80)
//   SCREENCAST_SIZE=1280x720            — Video resolution (default matches viewport)
//
// USAGE:
//   import { ScreencastHelper } from '../utils/helpers/screencast-helper';
//
//   const screencast = new ScreencastHelper(page);
//   await screencast.startRecording('US-101.AC-1');
//   await screencast.showChapter('Step 1: Login', 'Entering credentials');
//   // ... test actions happen ...
//   await screencast.showTestResult('PASS');
//   const videoPath = await screencast.stopRecording();
// =============================================================================

import * as fs   from 'fs';
import * as path from 'path';
import type { Page } from '@playwright/test';
import { logger } from './logger';

// =============================================================================
// CONSTANTS
// =============================================================================

/** Directory where screencast recordings are saved */
const SCREENCAST_DIR = path.join(process.cwd(), 'test-results', 'screencasts');

// =============================================================================
// CONFIGURATION — Read from environment variables
// =============================================================================

/** Master toggle: is screencast recording enabled? */
export function isScreencastEnabled(): boolean {
  return (process.env['SCREENCAST_ENABLED'] ?? 'true') === 'true';
}

/** Should action annotations be shown on the recording? */
function showActionsEnabled(): boolean {
  return (process.env['SCREENCAST_SHOW_ACTIONS'] ?? 'true') === 'true';
}

/** Should chapter title cards be shown at key steps? */
function showChaptersEnabled(): boolean {
  return (process.env['SCREENCAST_SHOW_CHAPTERS'] ?? 'true') === 'true';
}

/** Video quality: 0–100 (JPEG quality for each frame) */
function getQuality(): number {
  return parseInt(process.env['SCREENCAST_QUALITY'] ?? '80', 10);
}

/** Video resolution: "WIDTHxHEIGHT" string parsed to { width, height } */
function getSize(): { width: number; height: number } {
  const raw = process.env['SCREENCAST_SIZE'] ?? '1280x720';
  const [w, h] = raw.split('x').map(Number);
  return { width: w || 1280, height: h || 720 };
}

// =============================================================================
// CLASS: ScreencastHelper
// =============================================================================
// Wraps Playwright 1.59's page.screencast API for easy use in tests.
//
// LIFECYCLE:
//   1. Construct:  new ScreencastHelper(page)
//   2. Start:      await helper.startRecording('test-name')
//   3. Annotate:   await helper.showChapter('Step 1', 'description')
//   4. Stop:       const videoPath = await helper.stopRecording()
//
// The helper is designed to be created once per test and used throughout.
// All methods are safe to call even if screencast is disabled — they become
// no-ops, so your test code doesn't need if-checks everywhere.
// =============================================================================
export class ScreencastHelper {

  /** The Playwright Page this helper is attached to */
  private page: Page;

  /** Whether a recording is currently active */
  private isRecording: boolean = false;

  /** The file path of the current recording */
  private currentRecordingPath: string | null = null;

  /** Test name for the current recording */
  private testName: string = '';

  /** Frame count (for real-time frame callback) */
  private frameCount: number = 0;

  // ===========================================================================
  // CONSTRUCTOR
  // ===========================================================================
  constructor(page: Page) {
    this.page = page;
  }

  // ===========================================================================
  // METHOD: startRecording
  // ===========================================================================
  // PURPOSE:
  //   Begins screencast recording for a test. Creates the output directory,
  //   generates a unique filename, starts the recording, enables action
  //   annotations, and shows an opening chapter card.
  //
  // PARAMETERS:
  //   - testName: The test case identifier (e.g., "US-101.AC-1")
  //
  // RETURNS:
  //   The file path where the recording will be saved, or null if disabled.
  // ===========================================================================
  async startRecording(testName: string): Promise<string | null> {
    // If screencast is disabled, do nothing
    if (!isScreencastEnabled()) {
      logger.info('🎬 Screencast recording is disabled (SCREENCAST_ENABLED=false)');
      return null;
    }

    try {
      // Ensure the output directory exists
      if (!fs.existsSync(SCREENCAST_DIR)) {
        fs.mkdirSync(SCREENCAST_DIR, { recursive: true });
      }

      this.testName = testName;

      // Build a unique filename with timestamp
      const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
      const safeName  = testName.replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName  = `${safeName}_${timestamp}.webm`;
      this.currentRecordingPath = path.join(SCREENCAST_DIR, fileName);

      // Reset frame counter
      this.frameCount = 0;

      // ─── Start the screencast recording ───
      // page.screencast.start() begins capturing the browser screen
      // Options:
      //   path:    Where to save the .webm video file
      //   quality: JPEG quality for each frame (0–100)
      //   size:    Video resolution { width, height }
      //   onFrame: Callback invoked for each captured frame
      await (this.page as any).screencast.start({
        path:    this.currentRecordingPath,
        quality: getQuality(),
        size:    getSize(),
        onFrame: ({ data }: { data: Buffer }) => {
          this.frameCount++;
          // Real-time frame delivery — can be used for live streaming,
          // thumbnail generation, or AI vision analysis
          if (this.frameCount === 1) {
            logger.info(`🎬 Screencast: first frame captured (${data.length} bytes)`);
          }
        },
      });

      this.isRecording = true;
      logger.info(`🎬 Screencast recording started: ${fileName}`);

      // ─── Enable action annotations ───
      // showActions() renders a visual label on the video for every Playwright
      // action (click, fill, navigate, etc.) showing WHAT was done and WHERE
      if (showActionsEnabled()) {
        await (this.page as any).screencast.showActions({ position: 'bottom-right' });
        logger.info('🎬 Action annotations enabled (bottom-right)');
      }

      // ─── Show opening chapter card ───
      // showChapter() displays a full-screen title card with a blur backdrop
      // Perfect for marking the start of a test or a major section
      if (showChaptersEnabled()) {
        await (this.page as any).screencast.showChapter(`🧪 ${testName}`, {
          description: 'Test execution starting...',
          duration: 2000,
        });
      }

      return this.currentRecordingPath;

    } catch (error) {
      // Screencast API may not be available (older Playwright, non-Chromium, etc.)
      logger.warn(`🎬 Could not start screencast recording: ${error}`);
      this.isRecording = false;
      return null;
    }
  }

  // ===========================================================================
  // METHOD: showChapter
  // ===========================================================================
  // PURPOSE:
  //   Displays a chapter title card on the recording. This creates a visual
  //   bookmark in the video, making it easy to navigate to specific test steps.
  //
  //   The chapter card appears as a full-screen overlay with a blur backdrop,
  //   showing the title and optional description, then auto-dismisses.
  //
  // PARAMETERS:
  //   - title:       The chapter title (e.g., "Step 1: Navigate to Login")
  //   - description: Optional description text shown below the title
  //   - durationMs:  How long the card stays visible (default: 1500ms)
  // ===========================================================================
  async showChapter(title: string, description?: string, durationMs: number = 1500): Promise<void> {
    if (!this.isRecording || !showChaptersEnabled()) return;

    try {
      await (this.page as any).screencast.showChapter(title, {
        description: description ?? '',
        duration: durationMs,
      });
      logger.info(`📖 Screencast chapter: ${title}`);
    } catch (error) {
      // Non-fatal — chapter display failed but recording continues
      logger.warn(`📖 Could not show chapter "${title}": ${error}`);
    }
  }

  // ===========================================================================
  // METHOD: showOverlay
  // ===========================================================================
  // PURPOSE:
  //   Displays a sticky HTML overlay on the recording. Unlike chapters (which
  //   auto-dismiss), overlays persist until explicitly removed or the recording
  //   stops. They have pointer-events: none, so they don't interfere with
  //   the test's actual interactions.
  //
  //   Use overlays for: test name badges, timer displays, environment labels,
  //   agentic AI status indicators, or branding watermarks.
  //
  // PARAMETERS:
  //   - html:       HTML content for the overlay (inline styles supported)
  //   - durationMs: Optional auto-dismiss duration (omit for permanent overlay)
  //
  // RETURNS:
  //   A disposable object with a .dispose() method to remove the overlay,
  //   or null if overlay couldn't be shown.
  // ===========================================================================
  async showOverlay(html: string, durationMs?: number): Promise<{ dispose: () => Promise<void> } | null> {
    if (!this.isRecording) return null;

    try {
      const options: Record<string, unknown> = {};
      if (durationMs !== undefined) {
        options.duration = durationMs;
      }
      const disposable = await (this.page as any).screencast.showOverlay(html, options);
      logger.info('🏷️  Screencast overlay displayed');
      return disposable;
    } catch (error) {
      logger.warn(`🏷️  Could not show overlay: ${error}`);
      return null;
    }
  }

  // ===========================================================================
  // METHOD: showAgenticOverlay
  // ===========================================================================
  // PURPOSE:
  //   A pre-built overlay specifically designed for agentic AI test execution.
  //   Shows a branded badge in the top-left corner with the test name,
  //   "AI Agent" label, and a timestamp — providing clear visual evidence
  //   that the test was run autonomously by an AI agent.
  //
  // PARAMETERS:
  //   - testName:    The test case ID (e.g., "US-101.AC-1")
  //   - environment: The environment name (e.g., "staging", "dev")
  // ===========================================================================
  async showAgenticOverlay(testName: string, environment: string = 'staging'): Promise<{ dispose: () => Promise<void> } | null> {
    const html = `
      <div style="
        position: fixed; top: 8px; left: 8px; z-index: 99999;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white; padding: 8px 14px; border-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 12px; line-height: 1.4;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        pointer-events: none;
      ">
        <div style="font-weight: 700; font-size: 13px;">🤖 AI Agent</div>
        <div style="opacity: 0.9;">📋 ${testName}</div>
        <div style="opacity: 0.7; font-size: 10px;">🌍 ${environment} · ${new Date().toISOString().slice(0, 19)}</div>
      </div>
    `;
    return this.showOverlay(html);
  }

  // ===========================================================================
  // METHOD: showTestResult
  // ===========================================================================
  // PURPOSE:
  //   Shows a result chapter card at the end of the test recording.
  //   Displays a green ✅ PASS or red ❌ FAIL banner with the test name.
  //
  // PARAMETERS:
  //   - status:       'PASS' | 'FAIL' | 'ABORTED'
  //   - errorMessage: Optional error message to display on failure
  // ===========================================================================
  async showTestResult(status: 'PASS' | 'FAIL' | 'ABORTED', errorMessage?: string): Promise<void> {
    if (!this.isRecording || !showChaptersEnabled()) return;

    try {
      const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
      const title = `${emoji} ${status}: ${this.testName}`;
      const description = errorMessage
        ? `Error: ${errorMessage.substring(0, 200)}`
        : status === 'PASS'
          ? 'All assertions passed successfully'
          : 'Test execution completed';

      await (this.page as any).screencast.showChapter(title, {
        description,
        duration: 2500,
      });
      logger.info(`🎬 Screencast result card: ${status} for ${this.testName}`);
    } catch (error) {
      logger.warn(`🎬 Could not show result card: ${error}`);
    }
  }

  // ===========================================================================
  // METHOD: hideOverlays
  // ===========================================================================
  // PURPOSE:
  //   Removes all currently displayed overlays from the recording.
  //   Useful for cleaning up before showing a result card.
  // ===========================================================================
  async hideOverlays(): Promise<void> {
    if (!this.isRecording) return;

    try {
      await (this.page as any).screencast.hideOverlays();
      logger.info('🏷️  All overlays hidden');
    } catch (error) {
      logger.warn(`🏷️  Could not hide overlays: ${error}`);
    }
  }

  // ===========================================================================
  // METHOD: stopRecording
  // ===========================================================================
  // PURPOSE:
  //   Stops the screencast recording and saves the video file.
  //
  // RETURNS:
  //   The file path of the saved recording, or null if no recording was active.
  // ===========================================================================
  async stopRecording(): Promise<string | null> {
    if (!this.isRecording) return null;

    try {
      await (this.page as any).screencast.stop();
      this.isRecording = false;

      const recordingPath = this.currentRecordingPath;
      logger.info(`🎬 Screencast recording stopped: ${path.basename(recordingPath ?? 'unknown')}`);
      logger.info(`🎬 Total frames captured: ${this.frameCount}`);

      return recordingPath;

    } catch (error) {
      logger.warn(`🎬 Could not stop screencast recording: ${error}`);
      this.isRecording = false;
      return null;
    }
  }

  // ===========================================================================
  // GETTER: recordingPath
  // ===========================================================================
  // PURPOSE:
  //   Returns the file path of the current/most-recent recording.
  // ===========================================================================
  getRecordingPath(): string | null {
    return this.currentRecordingPath;
  }

  // ===========================================================================
  // GETTER: isActive
  // ===========================================================================
  // PURPOSE:
  //   Returns whether a recording is currently in progress.
  // ===========================================================================
  isActive(): boolean {
    return this.isRecording;
  }

  // ===========================================================================
  // GETTER: totalFrames
  // ===========================================================================
  // PURPOSE:
  //   Returns the total number of frames captured so far.
  // ===========================================================================
  getTotalFrames(): number {
    return this.frameCount;
  }
}

// =============================================================================
// CONVENIENCE FACTORY FUNCTION
// =============================================================================
// Creates a new ScreencastHelper instance. Useful for importing as a function
// instead of a class.
//
// USAGE:
//   import { createScreencastHelper } from '../utils/helpers/screencast-helper';
//   const screencast = createScreencastHelper(page);
// =============================================================================
export function createScreencastHelper(page: Page): ScreencastHelper {
  return new ScreencastHelper(page);
}
