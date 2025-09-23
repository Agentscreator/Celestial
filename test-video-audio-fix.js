/**
 * Test script to verify video recording with audio and proper upload
 */

async function testVideoAudioFix() {
  console.log('🎬 Testing Video Audio Fix');
  console.log('========================');
  
  try {
    // Test 1: Check if getUserMedia supports audio
    console.log('\n1️⃣ Testing getUserMedia audio support...');
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('❌ getUserMedia not supported');
      return;
    }
    
    // Test audio+video constraints
    const constraints = {
      video: { facingMode: 'user' },
      audio: true
    };
    
    console.log('📋 Testing constraints:', JSON.stringify(constraints, null, 2));
    
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✅ getUserMedia successful');
      
      // Check tracks
      const videoTracks = stream.getVideoTracks();
      const audioTracks = stream.getAudioTracks();
      
      console.log('📹 Video tracks:', videoTracks.length);
      console.log('🎵 Audio tracks:', audioTracks.length);
      
      if (videoTracks.length === 0) {
        console.error('❌ No video tracks found');
      } else {
        console.log('✅ Video track settings:', videoTracks[0].getSettings());
      }
      
      if (audioTracks.length === 0) {
        console.error('❌ No audio tracks found');
      } else {
        console.log('✅ Audio track settings:', audioTracks[0].getSettings());
      }
      
      // Test 2: Check MediaRecorder support with audio
      console.log('\n2️⃣ Testing MediaRecorder with audio...');
      
      const codecOptions = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=h264,aac',
        'video/webm;codecs=h264,opus',
        'video/mp4;codecs=avc1,mp4a',
        'video/webm',
        'video/mp4'
      ];
      
      let supportedCodec = null;
      for (const codec of codecOptions) {
        const isSupported = MediaRecorder.isTypeSupported(codec);
        console.log(`🔍 ${codec}: ${isSupported ? '✅ Supported' : '❌ Not supported'}`);
        if (isSupported && !supportedCodec) {
          supportedCodec = codec;
        }
      }
      
      if (!supportedCodec) {
        console.error('❌ No supported codecs found');
        return;
      }
      
      console.log('🎯 Selected codec:', supportedCodec);
      
      // Test MediaRecorder creation
      try {
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: supportedCodec,
          audioBitsPerSecond: 128000,
          videoBitsPerSecond: 2500000
        });
        
        console.log('✅ MediaRecorder created successfully');
        console.log('📊 MediaRecorder state:', mediaRecorder.state);
        console.log('📊 MediaRecorder mimeType:', mediaRecorder.mimeType);
        
        // Test recording for 2 seconds
        console.log('\n3️⃣ Testing short recording...');
        
        const chunks = [];
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
            console.log('📦 Chunk received:', event.data.size, 'bytes');
          }
        };
        
        mediaRecorder.onstop = () => {
          console.log('🛑 Recording stopped');
          console.log('📊 Total chunks:', chunks.length);
          
          if (chunks.length > 0) {
            const blob = new Blob(chunks, { type: supportedCodec });
            console.log('📦 Final blob size:', blob.size, 'bytes');
            console.log('📦 Final blob type:', blob.type);
            
            if (blob.size > 0) {
              console.log('✅ Recording successful with audio!');
              
              // Test 4: Verify blob can be converted to File
              const file = new File([blob], `test-video-${Date.now()}.webm`, { type: blob.type });
              console.log('📁 File created:', {
                name: file.name,
                size: file.size,
                type: file.type
              });
              
              console.log('✅ All tests passed! Video recording with audio should work.');
            } else {
              console.error('❌ Empty blob created');
            }
          } else {
            console.error('❌ No chunks recorded');
          }
        };
        
        mediaRecorder.start(1000); // Request data every second
        
        setTimeout(() => {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          }
        }, 2000); // Record for 2 seconds
        
      } catch (recorderError) {
        console.error('❌ MediaRecorder creation failed:', recorderError);
      }
      
    } catch (streamError) {
      console.error('❌ getUserMedia failed:', streamError);
      
      // Try video-only as fallback
      console.log('\n🔄 Trying video-only fallback...');
      try {
        const videoOnlyStream = await navigator.mediaDevices.getUserMedia({ video: true });
        console.log('⚠️ Video-only stream successful (no audio)');
        
        const videoTracks = videoOnlyStream.getVideoTracks();
        console.log('📹 Video-only tracks:', videoTracks.length);
        
        videoOnlyStream.getTracks().forEach(track => track.stop());
      } catch (videoError) {
        console.error('❌ Video-only also failed:', videoError);
      }
    } finally {
      // Clean up
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        console.log('🧹 Stream cleaned up');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Test 5: Check R2 configuration
async function testR2Configuration() {
  console.log('\n4️⃣ Testing R2 configuration...');
  
  try {
    // Create a small test file
    const testData = new Uint8Array([1, 2, 3, 4, 5]);
    const testBlob = new Blob([testData], { type: 'application/octet-stream' });
    const testFile = new File([testBlob], 'test.bin', { type: 'application/octet-stream' });
    
    const formData = new FormData();
    formData.append('content', 'Test R2 upload');
    formData.append('media', testFile);
    formData.append('isInvite', 'false');
    
    console.log('📤 Testing upload to /api/posts...');
    
    const response = await fetch('/api/posts', {
      method: 'POST',
      body: formData
    });
    
    console.log('📡 Response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Upload test successful');
      console.log('📄 Post created:', {
        id: result.post?.id,
        hasImage: !!result.post?.image,
        hasVideo: !!result.post?.video,
        mediaUrl: result.post?.image || result.post?.video
      });
    } else {
      const errorText = await response.text();
      console.error('❌ Upload test failed:', response.status, errorText);
    }
    
  } catch (uploadError) {
    console.error('❌ Upload test error:', uploadError);
  }
}

// Run tests
console.log('🚀 Starting video audio fix tests...');
testVideoAudioFix().then(() => {
  return testR2Configuration();
}).then(() => {
  console.log('\n🏁 All tests completed!');
}).catch(error => {
  console.error('❌ Test suite failed:', error);
});