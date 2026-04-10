package com.kramiz.productiontracker;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;
import java.util.ArrayList;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIntent(intent);
    }

    @Override
    public void onResume() {
        super.onResume();
        handleIntent(getIntent());
    }

    private void handleIntent(Intent intent) {
        String action = intent.getAction();
        String type = intent.getType();

        if (Intent.ACTION_SEND.equals(action) && type != null) {
            handleSendIntent(intent);
        } else if (Intent.ACTION_SEND_MULTIPLE.equals(action) && type != null) {
            handleSendMultipleIntent(intent);
        }
    }

    private void handleSendIntent(Intent intent) {
        Uri uri = (Uri) intent.getParcelableExtra(Intent.EXTRA_STREAM);
        if (uri != null) {
            Log.d("KramizShare", "Shared file received: " + uri.toString());
            // Send to Capacitor JS layer
            this.getBridge().triggerWindowJSEvent("kramizShareIntent", "{\"uri\": \"" + uri.toString() + "\"}");
            // Clear the intent so it doesn't trigger again on rotation/reload
            intent.removeExtra(Intent.EXTRA_STREAM);
            setIntent(new Intent());
        }
    }

    private void handleSendMultipleIntent(Intent intent) {
        ArrayList<Uri> uris = intent.getParcelableArrayListExtra(Intent.EXTRA_STREAM);
        if (uris != null) {
             Log.d("KramizShare", "Multiple shared files received");
             // For now, we just handle the first one in this simple implementation
             this.getBridge().triggerWindowJSEvent("kramizShareIntent", "{\"uri\": \"" + uris.get(0).toString() + "\"}");
             intent.removeExtra(Intent.EXTRA_STREAM);
             setIntent(new Intent());
        }
    }
}
