<template>
  <div class="chat-widget">
    <!-- Chat bubble button -->
    <div class="chat-bubble" @click="toggleChat" :class="{active: isOpen}">
      <span v-if="!isOpen" class="bubble-icon">💬</span>
      <span v-else class="bubble-icon">✕</span>
    </div>

    <!-- Chat panel -->
    <transition name="chat-slide">
      <div v-if="isOpen" class="chat-panel">
        <div class="chat-header">
          <h4>AI客服助手</h4>
          <span class="chat-subtitle">在线为您解答法律问题</span>
        </div>
        <div class="chat-messages" ref="messagesRef">
          <div v-if="messages.length === 0" class="chat-welcome">
            <p>👋 您好！我是AI客服助手</p>
            <p>有任何法律问题都可以问我</p>
          </div>
          <div v-for="(msg, idx) in messages" :key="idx" class="chat-msg" :class="msg.role">
            <div class="msg-avatar">{{ msg.role === "user" ? "👤" : "🤖" }}</div>
            <div class="msg-content">{{ msg.content }}</div>
          </div>
          <div v-if="loading" class="chat-msg assistant">
            <div class="msg-avatar">🤖</div>
            <div class="msg-content typing">正在思考中...</div>
          </div>
        </div>
        <div class="chat-input">
          <el-input
            v-model="inputText"
            placeholder="输入您的问题..."
            @keyup.enter="sendMessage"
            :disabled="loading"
            size="default" />
          <el-button
            type="primary"
            @click="sendMessage"
            :loading="loading"
            :disabled="!inputText.trim()">
            发送
          </el-button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import {ref, nextTick} from "vue";
import {sendChatMessage} from "../api";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

const isOpen = ref(false);
const inputText = ref("");
const messages = ref<ChatMsg[]>([]);
const loading = ref(false);
const sessionId = ref("");
const messagesRef = ref<HTMLElement>();

function toggleChat() {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    nextTick(() => scrollBottom());
  }
}

function scrollBottom() {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
    }
  });
}

async function sendMessage() {
  const text = inputText.value.trim();
  if (!text || loading.value) return;

  messages.value.push({role: "user", content: text});
  inputText.value = "";
  loading.value = true;
  scrollBottom();

  try {
    const res = await sendChatMessage({
      session_id: sessionId.value || undefined,
      message: text,
    });
    const data = res.data.data;
    sessionId.value = data.session_id;
    messages.value.push({role: "assistant", content: data.reply});
  } catch (e) {
    messages.value.push({role: "assistant", content: "抱歉，网络出了点问题，请稍后再试。"});
  } finally {
    loading.value = false;
    scrollBottom();
  }
}
</script>

<style scoped>
.chat-widget {
  position: fixed;
  bottom: 124px;
  right: 24px;
  z-index: 9999;
}

.chat-bubble {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1a1a2e, #0f3460);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
  transition: all 0.3s;
}
.chat-bubble:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);
}
.chat-bubble.active {
  background: #666;
}
.bubble-icon {
  font-size: 24px;
}

.chat-panel {
  position: absolute;
  bottom: 70px;
  right: 0;
  width: 380px;
  height: 520px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  background: linear-gradient(135deg, #1a1a2e, #0f3460);
  color: #fff;
  padding: 16px 20px;
}
.chat-header h4 {
  margin: 0;
  font-size: 16px;
}
.chat-subtitle {
  font-size: 12px;
  color: #ccc;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #f9f9f9;
}

.chat-welcome {
  text-align: center;
  color: #999;
  padding: 40px 20px;
}
.chat-welcome p {
  margin: 6px 0;
  font-size: 14px;
}

.chat-msg {
  display: flex;
  margin-bottom: 14px;
  align-items: flex-start;
}
.chat-msg.user {
  flex-direction: row-reverse;
}
.msg-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}
.chat-msg.user .msg-avatar {
  background: #e8f4fd;
}
.msg-content {
  max-width: 260px;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
  white-space: pre-wrap;
}
.chat-msg.user .msg-content {
  background: #0f3460;
  color: #fff;
  margin-right: 8px;
  border-top-right-radius: 4px;
}
.chat-msg.assistant .msg-content {
  background: #fff;
  color: #333;
  margin-left: 8px;
  border-top-left-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}
.typing {
  color: #999;
  font-style: italic;
}

.chat-input {
  display: flex;
  padding: 12px;
  gap: 8px;
  border-top: 1px solid #eee;
  background: #fff;
}
.chat-input .el-input {
  flex: 1;
}

/* Transition */
.chat-slide-enter-active,
.chat-slide-leave-active {
  transition: all 0.3s ease;
}
.chat-slide-enter-from,
.chat-slide-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
</style>
