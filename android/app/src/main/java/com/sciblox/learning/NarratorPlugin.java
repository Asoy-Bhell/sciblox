package com.sciblox.learning;

import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.speech.tts.Voice;
import android.os.Bundle;
import android.media.MediaPlayer;
import android.media.PlaybackParams;
import android.content.res.AssetFileDescriptor;
import com.getcapacitor.JSObject;
import com.getcapacitor.JSArray;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.ArrayList;
import java.util.Comparator;

@CapacitorPlugin(name="Narrator")
public class NarratorPlugin extends Plugin {
    private TextToSpeech engine;
    private volatile boolean ready=false;
    private MediaPlayer localPlayer;
    private int audioGeneration=0;
    @Override public void load(){
        engine=new TextToSpeech(getContext(),status->{
            ready=status==TextToSpeech.SUCCESS;
            if(ready&&engine!=null)engine.setOnUtteranceProgressListener(new UtteranceProgressListener(){
                @Override public void onStart(String id){}
                @Override public void onDone(String id){finished(id);}
                @Override public void onError(String id){finished(id);}
            });
        });
    }
    private void finished(String id){JSObject event=new JSObject();event.put("id",id);notifyListeners("finished",event);}
    @PluginMethod public void speak(PluginCall call){
        getActivity().runOnUiThread(()->{
        stopLocal();
        if(!ready||engine==null){call.resolve(new JSObject().put("spoken",false));return;}
        String text=call.getString("text","");
        if(text.isEmpty()){call.resolve(new JSObject().put("spoken",false));return;}
        boolean tagalog="tl".equals(call.getString("language","en"));
        Set<Voice> voices=engine.getVoices();Voice selected=null;
        String requested=call.getString("voiceName","");
        if(voices!=null)for(Voice voice:voices){if(matches(voice,tagalog)&&(selected==null||voice.getName().equals(requested)||!selected.getName().equals(requested)&&(femaleScore(voice)>femaleScore(selected)||femaleScore(voice)==femaleScore(selected)&&voice.getName().compareTo(selected.getName())<0)))selected=voice;}
        if(selected==null){call.resolve(new JSObject().put("spoken",false));return;}
        engine.setVoice(selected);engine.setSpeechRate(1.05f);engine.setPitch(1f);
        int status=engine.speak(text,TextToSpeech.QUEUE_FLUSH,new Bundle(),UUID.randomUUID().toString());
        call.resolve(new JSObject().put("spoken",status==TextToSpeech.SUCCESS).put("voiceName",selected.getName()).put("recordedVoice",false));
        });
    }
    private int femaleScore(Voice voice){String name=voice.getName().toLowerCase(Locale.ROOT);return name.matches(".*(female|woman|zira|samantha|susan|hazel|jenny).*")?1:0;}
    private boolean matches(Voice voice,boolean tagalog){String lang=voice.getLocale().getLanguage();return !voice.isNetworkConnectionRequired()&&(voice.getFeatures()==null||!voice.getFeatures().contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED))&&(tagalog?lang.equals("tl")||lang.equals("fil"):lang.equals("en"));}
    @PluginMethod public void voices(PluginCall call){
        JSArray result=new JSArray();boolean tagalog="tl".equals(call.getString("language","en"));
        if(ready&&engine!=null&&engine.getVoices()!=null){ArrayList<Voice> sorted=new ArrayList<>(engine.getVoices());sorted.sort(Comparator.comparing(Voice::getName));for(Voice voice:sorted)if(matches(voice,tagalog))result.put(new JSObject().put("id",voice.getName()).put("name",voice.getName()).put("language",voice.getLocale().toLanguageTag()));}
        call.resolve(new JSObject().put("voices",result));
    }
    private void stopLocal(){audioGeneration++;if(localPlayer!=null){localPlayer.release();localPlayer=null;}}
    @PluginMethod public void playLocal(PluginCall call){getActivity().runOnUiThread(()->{
        stopLocal();if(engine!=null)engine.stop();JSArray paths=call.getArray("paths",new JSArray());
        try{if(paths.length()==0||paths.length()>8)throw new Exception("Invalid audio queue");for(int i=0;i<paths.length();i++)if(!paths.getString(i).matches("/assets/bhell/[A-Za-z0-9_/-]+\\.(wav|mp3|ogg)"))throw new Exception("Invalid local audio path");playClip(paths,0,audioGeneration,call);}catch(Exception e){call.resolve(new JSObject().put("spoken",false));}
    });}
    private void playClip(JSArray paths,int index,int generation,PluginCall call){
        if(generation!=audioGeneration)return;
        if(index>=paths.length()){localPlayer=null;finished("local-audio");return;}
        try{
            MediaPlayer player=new MediaPlayer();localPlayer=player;
            try(AssetFileDescriptor source=getContext().getAssets().openFd("public"+paths.getString(index))){player.setDataSource(source.getFileDescriptor(),source.getStartOffset(),source.getLength());}
            player.setOnPreparedListener(value->{if(generation!=audioGeneration)return;try{value.setPlaybackParams(new PlaybackParams().setSpeed(1.05f).setPitch(1f));}catch(Exception ignored){}value.start();if(index==0)call.resolve(new JSObject().put("spoken",true).put("recordedVoice",true));});
            player.setOnCompletionListener(value->{if(generation!=audioGeneration)return;value.release();localPlayer=null;playClip(paths,index+1,generation,call);});
            player.setOnErrorListener((value,what,extra)->{if(generation==audioGeneration){stopLocal();if(index==0)call.resolve(new JSObject().put("spoken",false));finished("local-audio-error");}return true;});
            player.prepareAsync();
        }catch(Exception e){stopLocal();if(index==0)call.resolve(new JSObject().put("spoken",false));finished("local-audio-error");}
    }
    @PluginMethod public void stop(PluginCall call){getActivity().runOnUiThread(()->{stopLocal();if(engine!=null)engine.stop();call.resolve();});}
    @Override protected void handleOnDestroy(){getActivity().runOnUiThread(this::stopLocal);if(engine!=null){engine.stop();engine.shutdown();}ready=false;}
}
