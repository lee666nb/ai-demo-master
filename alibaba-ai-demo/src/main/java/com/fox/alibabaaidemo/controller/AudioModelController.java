package com.fox.alibabaaidemo.controller;

import com.alibaba.cloud.ai.dashscope.audio.DashScopeAudioTranscriptionModel;
import com.alibaba.cloud.ai.dashscope.audio.DashScopeAudioTranscriptionOptions;
import com.alibaba.cloud.ai.dashscope.audio.synthesis.SpeechSynthesisModel;
import com.alibaba.cloud.ai.dashscope.audio.synthesis.SpeechSynthesisPrompt;
import com.alibaba.cloud.ai.dashscope.audio.synthesis.SpeechSynthesisResponse;
import org.springframework.ai.audio.transcription.AudioTranscriptionPrompt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.ByteBuffer;

/**
 * @author: Fox
 * @Desc:
 **/
@RestController
@RequestMapping("/audio")
public class AudioModelController {

    private final SpeechSynthesisModel speechSynthesisModel;

    @Autowired
    public AudioModelController(SpeechSynthesisModel speechSynthesisModel) {
        this.speechSynthesisModel = speechSynthesisModel;
    }

    @GetMapping("/synthesize")
    public ResponseEntity<byte[]> synthesizeSpeech(@RequestParam String text) throws IOException {
        // 构建语音合成请求
        SpeechSynthesisPrompt prompt = new SpeechSynthesisPrompt(text);

        // 调用模型生成语音
        SpeechSynthesisResponse response = speechSynthesisModel.call(prompt);
        ByteBuffer audioData = response.getResult().getOutput().getAudio();

        // 将 ByteBuffer 转换为字节数组
        byte[] audioBytes = new byte[audioData.remaining()];
        audioData.get(audioBytes);

        // 返回音频流（MP3格式）
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header("Content-Disposition", "attachment; filename=output.mp3")
                .body(audioBytes);
    }


}
