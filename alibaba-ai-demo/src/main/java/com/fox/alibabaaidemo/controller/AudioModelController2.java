package com.fox.alibabaaidemo.controller;

import com.alibaba.cloud.ai.dashscope.audio.DashScopeAudioTranscriptionModel;
import com.alibaba.cloud.ai.dashscope.audio.DashScopeAudioTranscriptionOptions;
import org.springframework.ai.audio.transcription.AudioTranscriptionPrompt;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.MalformedURLException;

/**
 * @author: Fox
 * @Desc:
 **/
@RestController
public class AudioModelController2 {

    private static final String AUDIO_RESOURCES_URL = "https://dashscope.oss-cn-beijing.aliyuncs.com/samples/audio/paraformer/hello_world_female2.wav";

    private final DashScopeAudioTranscriptionModel dashScopeAudioTranscriptionModel; //modelname:sensevoice-v1,paraformer-realtime-v2,paraformer-v2

    AudioModelController2(DashScopeAudioTranscriptionModel dashScopeAudioTranscriptionModel){
        this.dashScopeAudioTranscriptionModel = dashScopeAudioTranscriptionModel;
    }

    @GetMapping("/audio")
    public String audio() throws MalformedURLException {
        Resource resource =new UrlResource(AUDIO_RESOURCES_URL);

        AudioTranscriptionPrompt prompt = new AudioTranscriptionPrompt(resource,
                DashScopeAudioTranscriptionOptions.builder()
                        .withModel("sensevoice-v1")
                        .build());

        return dashScopeAudioTranscriptionModel.call(prompt).getResult().getOutput();
    }
}
