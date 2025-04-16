import { BaasClient } from "@meeting-baas/sdk/dist/generated/baas/api/client";
import { BotParam2 } from "@meeting-baas/sdk/dist/generated/baas/models/bot-param2";
import { CreateCalendarParams } from "@meeting-baas/sdk/dist/generated/baas/models/create-calendar-params";
import { Provider } from "@meeting-baas/sdk/dist/generated/baas/models/provider";
import { UpdateCalendarParams } from "@meeting-baas/sdk/dist/generated/baas/models/update-calendar-params";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";
import { registerJoinTool } from "./tools/bots/join";
import { registerEchoTool } from "./tools/utils/echo";

export function registerTools(server: McpServer, apiKey: string): McpServer {
  const baasClient = new BaasClient({
    apiKey: apiKey,
  });

  // Register bot tools
  const updatedServer = registerJoinTool(server, baasClient);

  // Register Meeting BaaS SDK tools
  updatedServer.tool(
    "leaveMeeting",
    "Remove an AI bot from a meeting. Use this when you want to: 1) End a meeting recording 2) Stop transcription 3) Disconnect the bot from the meeting",
    { botId: z.string().uuid() },
    async ({ botId }: { botId: string }) => {
      try {
        console.log(`Attempting to remove bot ${botId} from meeting...`);
        const response = await baasClient.defaultApi.leave({ uuid: botId });
        console.log(
          "Leave meeting response:",
          JSON.stringify(response.data, null, 2)
        );

        if (!response.data) {
          console.error("Leave meeting response missing data");
          return {
            content: [
              {
                type: "text",
                text: "Failed to leave meeting: No response data received",
              },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `Successfully removed bot ${botId} from meeting`,
            },
          ],
        };
      } catch (error) {
        console.error("Failed to leave meeting:", error);
        let errorMessage = "Failed to leave meeting";

        if (error instanceof Error) {
          console.error("Error details:", {
            name: error.name,
            message: error.message,
            stack: error.stack,
          });
          errorMessage += `: ${error.message}`;
        } else if (typeof error === "object" && error !== null) {
          console.error("Error object:", JSON.stringify(error, null, 2));
        }

        return {
          content: [
            {
              type: "text",
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }
  );

  updatedServer.tool(
    "getMeetingData",
    "Get data about a meeting that a bot has joined. Use this when you want to: 1) Check meeting status 2) Get recording information 3) Access transcription data",
    { botId: z.string().uuid() },
    async ({ botId }: { botId: string }) => {
      try {
        const response = await baasClient.defaultApi.getMeetingData({
          bot_id: botId,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      } catch (error) {
        console.error("Failed to get meeting data:", error);
        return {
          content: [
            {
              type: "text",
              text: "Failed to get meeting data",
            },
          ],
          isError: true,
        };
      }
    }
  );

  updatedServer.tool(
    "deleteData",
    "Delete data associated with a meeting bot. Use this when you want to: 1) Remove meeting recordings 2) Delete transcription data 3) Clean up bot data",
    { botId: z.string().uuid() },
    async ({ botId }: { botId: string }) => {
      try {
        const response = await baasClient.defaultApi.deleteData({
          uuid: botId,
        });
        return {
          content: [
            {
              type: "text",
              text: "Successfully deleted meeting data",
            },
          ],
        };
      } catch (error) {
        console.error("Failed to delete meeting data:", error);
        return {
          content: [
            {
              type: "text",
              text: "Failed to delete meeting data",
            },
          ],
          isError: true,
        };
      }
    }
  );

  updatedServer.tool(
    "createCalendar",
    "Create a new calendar integration. Use this when you want to: 1) Set up automatic meeting recordings 2) Configure calendar-based bot scheduling 3) Enable recurring meeting coverage",
    {
      oauthClientId: z.string(),
      oauthClientSecret: z.string(),
      oauthRefreshToken: z.string(),
      platform: z.enum(["Google", "Microsoft"]),
      rawCalendarId: z.string().optional(),
    },
    async ({
      oauthClientId,
      oauthClientSecret,
      oauthRefreshToken,
      platform,
      rawCalendarId,
    }) => {
      try {
        const createCalendarParams: CreateCalendarParams = {
          oauth_client_id: oauthClientId,
          oauth_client_secret: oauthClientSecret,
          oauth_refresh_token: oauthRefreshToken,
          platform:
            platform === "Google" ? Provider.google : Provider.microsoft,
          raw_calendar_id: rawCalendarId || null,
        };
        const response = await baasClient.calendarsApi.createCalendar(
          createCalendarParams
        );
        return {
          content: [
            {
              type: "text",
              text: "Successfully created calendar",
            },
          ],
        };
      } catch (error) {
        console.error("Failed to create calendar:", error);
        return {
          content: [
            {
              type: "text",
              text: "Failed to create calendar",
            },
          ],
          isError: true,
        };
      }
    }
  );

  updatedServer.tool(
    "listCalendars",
    "List all calendar integrations. Use this when you want to: 1) View configured calendars 2) Check calendar status 3) Manage calendar integrations",
    {},
    async () => {
      try {
        const response = await baasClient.calendarsApi.listCalendars();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      } catch (error) {
        console.error("Failed to list calendars:", error);
        return {
          content: [
            {
              type: "text",
              text: "Failed to list calendars",
            },
          ],
          isError: true,
        };
      }
    }
  );

  updatedServer.tool(
    "getCalendar",
    "Get details about a specific calendar integration. Use this when you want to: 1) View calendar configuration 2) Check calendar status 3) Verify calendar settings",
    { calendarId: z.string().uuid() },
    async ({ calendarId }: { calendarId: string }) => {
      try {
        const response = await baasClient.calendarsApi.getCalendar({
          uuid: calendarId,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      } catch (error) {
        console.error("Failed to get calendar:", error);
        return {
          content: [
            {
              type: "text",
              text: "Failed to get calendar",
            },
          ],
          isError: true,
        };
      }
    }
  );

  updatedServer.tool(
    "deleteCalendar",
    "Delete a calendar integration. Use this when you want to: 1) Remove a calendar connection 2) Stop automatic recordings 3) Clean up calendar data",
    { calendarId: z.string().uuid() },
    async ({ calendarId }: { calendarId: string }) => {
      try {
        const response = await baasClient.calendarsApi.deleteCalendar({
          uuid: calendarId,
        });
        return {
          content: [
            {
              type: "text",
              text: "Successfully deleted calendar",
            },
          ],
        };
      } catch (error) {
        console.error("Failed to delete calendar:", error);
        return {
          content: [
            {
              type: "text",
              text: "Failed to delete calendar",
            },
          ],
          isError: true,
        };
      }
    }
  );

  updatedServer.tool(
    "resyncAllCalendars",
    "Resynchronize all calendar integrations. Use this when you want to: 1) Update calendar data 2) Fix sync issues 3) Refresh calendar connections",
    {},
    async () => {
      try {
        const response = await baasClient.calendarsApi.resyncAllCalendars();
        return {
          content: [
            {
              type: "text",
              text: "Successfully resynced all calendars",
            },
          ],
        };
      } catch (error) {
        console.error("Failed to resync calendars:", error);
        return {
          content: [
            {
              type: "text",
              text: "Failed to resync calendars",
            },
          ],
          isError: true,
        };
      }
    }
  );

  updatedServer.tool(
    "listRecentBots",
    "Get a list of all bots with their metadata. Use this when you want to: 1) View active bots 2) Check bot status 3) Monitor bot activity",
    {
      botName: z.string().optional(),
      createdAfter: z.string().optional(),
      createdBefore: z.string().optional(),
      cursor: z.string().optional(),
      filterByExtra: z.string().optional(),
      limit: z.number().int().min(1).max(50).optional(),
      meetingUrl: z.string().optional(),
      sortByExtra: z.string().optional(),
      speakerName: z.string().optional(),
    },
    async (params) => {
      try {
        const queryParams: Record<string, any> = {};
        if (params.botName) queryParams.bot_name = params.botName;
        if (params.createdAfter)
          queryParams.created_after = params.createdAfter;
        if (params.createdBefore)
          queryParams.created_before = params.createdBefore;
        if (params.cursor) queryParams.cursor = params.cursor;
        if (params.filterByExtra)
          queryParams.filter_by_extra = params.filterByExtra;
        if (params.limit) queryParams.limit = params.limit;
        if (params.meetingUrl) queryParams.meeting_url = params.meetingUrl;
        if (params.sortByExtra) queryParams.sort_by_extra = params.sortByExtra;
        if (params.speakerName) queryParams.speaker_name = params.speakerName;

        const response = await baasClient.defaultApi.botsWithMetadata(
          queryParams
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      } catch (error) {
        console.error("Failed to get bots with metadata:", error);
        return {
          content: [
            {
              type: "text",
              text: "Failed to get bots with metadata",
            },
          ],
          isError: true,
        };
      }
    }
  );

  updatedServer.tool(
    "retranscribeBot",
    "Transcribe or retranscribe a bot's audio. Use this when you want to: 1) Generate new transcripts 2) Use a different speech-to-text provider 3) Improve transcription quality",
    {
      botUuid: z.string().uuid(),
      speechToText: z
        .object({
          provider: z.enum(["Gladia", "Runpod", "Default"]),
          apiKey: z.string().optional(),
        })
        .optional(),
      webhookUrl: z.string().optional(),
    },
    async ({ botUuid, speechToText, webhookUrl }) => {
      try {
        const params = {
          bot_uuid: botUuid,
          speech_to_text: speechToText,
          webhook_url: webhookUrl,
        };
        const response = await baasClient.defaultApi.retranscribeBot(params);
        return {
          content: [
            {
              type: "text",
              text: "Successfully initiated retranscription",
            },
          ],
        };
      } catch (error) {
        console.error("Failed to retranscribe bot:", error);
        return {
          content: [
            {
              type: "text",
              text: "Failed to retranscribe bot",
            },
          ],
          isError: true,
        };
      }
    }
  );

  updatedServer.tool(
    "listRawCalendars",
    "List raw calendars from provider. Use this when you want to: 1) View available calendars 2) See calendar IDs 3) Check primary status",
    {
      oauthClientId: z.string(),
      oauthClientSecret: z.string(),
      oauthRefreshToken: z.string(),
      platform: z.enum(["Google", "Microsoft"]),
    },
    async ({
      oauthClientId,
      oauthClientSecret,
      oauthRefreshToken,
      platform,
    }) => {
      try {
        const params = {
          oauth_client_id: oauthClientId,
          oauth_client_secret: oauthClientSecret,
          oauth_refresh_token: oauthRefreshToken,
          platform:
            platform === "Google" ? Provider.google : Provider.microsoft,
        };
        const response = await baasClient.calendarsApi.listRawCalendars(params);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      } catch (error) {
        console.error("Failed to list raw calendars:", error);
        return {
          content: [
            {
              type: "text",
              text: "Failed to list raw calendars",
            },
          ],
          isError: true,
        };
      }
    }
  );

  updatedServer.tool(
    "listEvents",
    "List all scheduled events. Use this when you want to: 1) View upcoming recordings 2) Check scheduled transcriptions 3) Monitor planned bot activity",
    {
      calendarId: z.string().uuid(),
      attendeeEmail: z.string().optional(),
      cursor: z.string().optional(),
      organizerEmail: z.string().optional(),
      startDateGte: z.string().optional(),
      startDateLte: z.string().optional(),
      status: z.enum(["upcoming", "past", "all"]).optional(),
      updatedAtGte: z.string().optional(),
    },
    async (params) => {
      try {
        const queryParams: Record<string, any> = {
          calendar_id: params.calendarId,
        };

        if (params.attendeeEmail)
          queryParams.attendee_email = params.attendeeEmail;
        if (params.cursor) queryParams.cursor = params.cursor;
        if (params.organizerEmail)
          queryParams.organizer_email = params.organizerEmail;
        if (params.startDateGte)
          queryParams.start_date_gte = params.startDateGte;
        if (params.startDateLte)
          queryParams.start_date_lte = params.startDateLte;
        if (params.status) queryParams.status = params.status;
        if (params.updatedAtGte)
          queryParams.updated_at_gte = params.updatedAtGte;

        const response = await baasClient.calendarsApi.listEvents(queryParams);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      } catch (error) {
        console.error("Failed to list events:", error);
        return {
          content: [
            {
              type: "text",
              text: "Failed to list events",
            },
          ],
          isError: true,
        };
      }
    }
  );

  updatedServer.tool(
    "getEvent",
    "Get detailed information about a specific calendar event. Use this when you want to: 1) View event details 2) Check attendees 3) Verify meeting information",
    { eventUuid: z.string().uuid() },
    async ({ eventUuid }) => {
      try {
        const response = await baasClient.calendarsApi.getEvent({
          uuid: eventUuid,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      } catch (error) {
        console.error("Failed to get event:", error);
        return {
          content: [
            {
              type: "text",
              text: "Failed to get event",
            },
          ],
          isError: true,
        };
      }
    }
  );

  updatedServer.tool(
    "scheduleRecordEvent",
    "Schedule a recording. Use this when you want to: 1) Set up automatic recording 2) Schedule future transcriptions 3) Plan meeting recordings",
    {
      eventUuid: z.string().uuid(),
      botName: z.string(),
      botImage: z.string().optional(),
      deduplicationKey: z.string().optional(),
      enterMessage: z.string().optional(),
      extra: z.record(z.any()).optional(),
      nooneJoinedTimeout: z.number().int().optional(),
      recordingMode: z
        .enum(["speaker_view", "gallery_view", "audio_only"])
        .optional(),
      speechToText: z
        .object({
          provider: z.enum(["Gladia", "Runpod", "Default"]),
          apiKey: z.string().optional(),
        })
        .optional(),
      streamingAudioFrequency: z.enum(["16khz", "24khz"]).optional(),
      streamingInput: z.string().optional(),
      streamingOutput: z.string().optional(),
      waitingRoomTimeout: z.number().int().optional(),
      webhookUrl: z.string().optional(),
      allOccurrences: z.boolean().optional(),
    },
    async (params) => {
      try {
        const { eventUuid, allOccurrences, ...botParams } = params;

        const botParam: BotParam2 = {
          bot_name: botParams.botName,
          bot_image: botParams.botImage || null,
          deduplication_key: botParams.deduplicationKey || null,
          enter_message: botParams.enterMessage || null,
          extra: botParams.extra || {},
          noone_joined_timeout: botParams.nooneJoinedTimeout || null,
          recording_mode: botParams.recordingMode || null,
          speech_to_text: botParams.speechToText || null,
          streaming_audio_frequency: botParams.streamingAudioFrequency || null,
          streaming_input: botParams.streamingInput || null,
          streaming_output: botParams.streamingOutput || null,
          waiting_room_timeout: botParams.waitingRoomTimeout || null,
          webhook_url: botParams.webhookUrl || null,
        };

        const response = await baasClient.calendarsApi.scheduleRecordEvent(
          { uuid: eventUuid },
          { all_occurrences: allOccurrences || false },
          botParam
        );

        return {
          content: [
            {
              type: "text",
              text: "Successfully scheduled event recording",
            },
          ],
        };
      } catch (error) {
        console.error("Failed to schedule event recording:", error);
        return {
          content: [
            {
              type: "text",
              text: "Failed to schedule event recording",
            },
          ],
          isError: true,
        };
      }
    }
  );

  updatedServer.tool(
    "unscheduleRecordEvent",
    "Cancel a scheduled recording. Use this when you want to: 1) Cancel automatic recording 2) Stop planned transcription 3) Remove scheduled bot activity",
    {
      eventUuid: z.string().uuid(),
      allOccurrences: z.boolean().optional(),
    },
    async ({ eventUuid, allOccurrences }) => {
      try {
        const response = await baasClient.calendarsApi.unscheduleRecordEvent(
          { uuid: eventUuid },
          { all_occurrences: allOccurrences || false }
        );
        return {
          content: [
            {
              type: "text",
              text: "Successfully unscheduled event recording",
            },
          ],
        };
      } catch (error) {
        console.error("Failed to unschedule event recording:", error);
        return {
          content: [
            {
              type: "text",
              text: "Failed to unschedule event recording",
            },
          ],
          isError: true,
        };
      }
    }
  );

  updatedServer.tool(
    "updateCalendar",
    "Update a calendar integration configuration. Use this when you want to: 1) Modify calendar settings 2) Update connection details 3) Change calendar configuration",
    {
      calendarId: z.string().uuid(),
      oauthClientId: z.string(),
      oauthClientSecret: z.string(),
      oauthRefreshToken: z.string(),
      platform: z.enum(["Google", "Microsoft"]),
    },
    async ({
      calendarId,
      oauthClientId,
      oauthClientSecret,
      oauthRefreshToken,
      platform,
    }) => {
      try {
        const updateCalendarParams: UpdateCalendarParams = {
          oauth_client_id: oauthClientId,
          oauth_client_secret: oauthClientSecret,
          oauth_refresh_token: oauthRefreshToken,
          platform:
            platform === "Google" ? Provider.google : Provider.microsoft,
        };

        const response = await baasClient.calendarsApi.updateCalendar(
          { uuid: calendarId },
          updateCalendarParams
        );

        return {
          content: [
            {
              type: "text",
              text: "Successfully updated calendar",
            },
          ],
        };
      } catch (error) {
        console.error("Failed to update calendar:", error);
        return {
          content: [
            {
              type: "text",
              text: "Failed to update calendar",
            },
          ],
          isError: true,
        };
      }
    }
  );

  updatedServer.tool(
    "patchBot",
    "Update bot configuration for a scheduled event. Use this when you want to: 1) Modify recording settings 2) Update webhook URLs 3) Change bot parameters",
    {
      eventUuid: z.string().uuid(),
      botName: z.string().optional(),
      botImage: z.string().optional(),
      deduplicationKey: z.string().optional(),
      enterMessage: z.string().optional(),
      extra: z.record(z.any()).optional(),
      nooneJoinedTimeout: z.number().int().optional(),
      recordingMode: z
        .enum(["speaker_view", "gallery_view", "audio_only"])
        .optional(),
      speechToText: z
        .object({
          provider: z.enum(["Gladia", "Runpod", "Default"]),
          apiKey: z.string().optional(),
        })
        .optional(),
      streamingAudioFrequency: z.enum(["16khz", "24khz"]).optional(),
      streamingInput: z.string().optional(),
      streamingOutput: z.string().optional(),
      waitingRoomTimeout: z.number().int().optional(),
      webhookUrl: z.string().optional(),
      allOccurrences: z.boolean().optional(),
    },
    async (params) => {
      try {
        const { eventUuid, allOccurrences, ...botParams } = params;

        // Convert camelCase to snake_case for the API
        const botParam: Record<string, any> = {};
        if (botParams.botName !== undefined)
          botParam.bot_name = botParams.botName;
        if (botParams.botImage !== undefined)
          botParam.bot_image = botParams.botImage;
        if (botParams.deduplicationKey !== undefined)
          botParam.deduplication_key = botParams.deduplicationKey;
        if (botParams.enterMessage !== undefined)
          botParam.enter_message = botParams.enterMessage;
        if (botParams.extra !== undefined) botParam.extra = botParams.extra;
        if (botParams.nooneJoinedTimeout !== undefined)
          botParam.noone_joined_timeout = botParams.nooneJoinedTimeout;
        if (botParams.recordingMode !== undefined)
          botParam.recording_mode = botParams.recordingMode;
        if (botParams.speechToText !== undefined)
          botParam.speech_to_text = botParams.speechToText;
        if (botParams.streamingAudioFrequency !== undefined)
          botParam.streaming_audio_frequency =
            botParams.streamingAudioFrequency;
        if (botParams.streamingInput !== undefined)
          botParam.streaming_input = botParams.streamingInput;
        if (botParams.streamingOutput !== undefined)
          botParam.streaming_output = botParams.streamingOutput;
        if (botParams.waitingRoomTimeout !== undefined)
          botParam.waiting_room_timeout = botParams.waitingRoomTimeout;
        if (botParams.webhookUrl !== undefined)
          botParam.webhook_url = botParams.webhookUrl;

        const response = await baasClient.calendarsApi.patchBot(
          { uuid: eventUuid },
          { all_occurrences: allOccurrences || false },
          botParam
        );

        return {
          content: [
            {
              type: "text",
              text: "Successfully updated bot configuration",
            },
          ],
        };
      } catch (error) {
        console.error("Failed to update bot configuration:", error);
        return {
          content: [
            {
              type: "text",
              text: "Failed to update bot configuration",
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Add echo tool for testing
  const finalServer = registerEchoTool(updatedServer);

  return finalServer;
}

export default registerTools;
