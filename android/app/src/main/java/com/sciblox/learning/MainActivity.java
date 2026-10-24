package com.sciblox.learning;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;

public class MainActivity extends BridgeActivity {
    @Override public void onCreate(Bundle savedInstanceState) {
        registerPlugin(LocalMultiplayerPlugin.class);
        registerPlugin(NarratorPlugin.class);
        registerPlugin(GameScreenPlugin.class);
        registerPlugin(ClassroomPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
