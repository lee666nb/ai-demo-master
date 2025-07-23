<script setup lang="ts">
import type { MessageItem } from "@/types/message";
import Markdown from "vue3-markdown-it";
let message = defineProps<MessageItem>();
</script>

<template>
  <div>
    <a-comment>
      <template #author
        ><a style="font-size: 16px">{{
          message.role === "user" ? "🧑‍💻 你" : "🤖 客服"
        }}</a></template
      >
      <template #content>
        <div
          style="
            width: 98%;
            border-radius: 5px;
            padding: 20px;
            background: white;
          "
        >
          <markdown :source="message.content"></markdown>
          <!--          <p>-->
          <!--            {{ message.content }}-->
          <!--          </p>-->
        </div>
      </template>
    </a-comment>
  </div>
</template>

<style scoped lang="less"></style>
