<?

  //
  // AUTO KEYWORD-BASED FOLLOWER CURATION BOT (by @levelsio)
  //
  // File: twitterFollowerCuratorBot.php
  //
  // Created: May 2021
  // License: MIT
  //
  // Dependency: https://github.com/abraham/twitteroauth via Composer
  //
  // Schedule/cron: @hourly
  // 
  // 1) This script goes through your new followers and curates them to pre-emptively remove trolls
  // 2) It checks their name, bio, location etc. for specific keywords
  // 3) If it matches, it blocks them, then quickly unblocks them, which results in them automatically unfollowing you
  // 4) This means they won't see your tweets anymore in their timeline
  // 5) It also mutes them so you won't see their tweets anymore either
  // 6) Extra features are unfollowing based
  //     a) low follower count (<10)
  //    b) no profile image
  //    c) account created in last 30 days
  // 7) It avoids removing big followers (>10,000 followers)
  // 8) Tip: you can also curate entire cities, for ex I auto remove followers from San Francisco because I think they live in a bubble and their tweets are usually annoying to me
  // 9) It saves the amount of people removed or approved in ./blockedCount.txt and ./approvedCount.txt, and saves cache in ./approvedUserIdsCache.json to avoid re-checking the same followers
  //

  // <config>
    // <Twitter app credentials>
      $consumer_key='';
      $consumer_secret='';
      $user_token='';
      $user_token_secret='';
    // </Twitter app credentials>

    // <keywords to match>
      // change this with your own keywords you want to match users on to unfollow
      $keywords=array(
        'biden',
        'trump',
        'san francisco',
      );
    // </keywords to match>

  // </config>


  error_reporting(E_ALL);

  $approvedUserIds=json_decode(file_get_contents(__DIR__.'/approvedUserIdsCache.json'),true);
  if(!is_array($approvedUserIds)) {
    $approvedUserIds=array();
  }

  require(__DIR__.'/vendor/autoload.php');
  use Abraham\TwitterOAuth\TwitterOAuth;

  if($connection = new TwitterOAuth($consumer_key, $consumer_secret, $user_token, $user_token_secret)) {
  }
  else {
    echo "(!) Cannot connect to Twitter";
    exit();
  }

  $self = $connection->get("account/verify_credentials");
  
  $self=json_decode(json_encode($self),true);
  $selfId=$self['id'];

  if(!$response=$connection->get('followers/ids',array('count'=>100))) {
    echo 'Error';
    exit();
  }

  $newlyFollowingUserIds=$response->ids;

  if(empty($newlyFollowingUserIds)) {
    echo "Bad response empty ids: ".json_encode($response);
    exit;
  }

  foreach($newlyFollowingUserIds as $userId) {
    
    if(in_array($userId,$approvedUserIds)) {
      echo $userId." already approved ";
      echo "\n";
      continue;
    }

    echo "😴 Sleeping for 5 seconds...";
    echo "\n";
    sleep(5);

    if(!$user=$connection->get('users/show',array('user_id'=>$userId))) {
      echo 'Error';
      exit();
    }

    echo '==========================';
    echo "\n";
    echo '#'.$userId;
    echo "\n";
    echo 'name='.$user->name;
    echo "\n";
    echo 'screen_name='.$user->screen_name;
    echo "\n";
    echo 'description='.$user->description;
    echo "\n";
    echo 'location='.$user->location;
    echo "\n";
    echo 'followers_count='.$user->followers_count;
    echo "\n";
    echo 'default_profile_image='.$user->default_profile_image;
    echo "\n";
    echo "\n";

    $suspiciousUserFlags=0;
    if($user->default_profile_image) {
      $suspiciousUserFlags++;
      $blockReason="they have no profile image set";
    }
    if($user->followers_count<10) {
      $suspiciousUserFlags++;
      $blockReason="they have a low follower count <10";
    }
    if($user->protected) {
      $suspiciousUserFlags++;
      $blockReason="they have a private account";
    }
    if(strtotime($user->created_at)>strtotime("-30 days")) {
      $suspiciousUserFlags++;
      $blockReason="they have an account created in the last 30 days";
    }

    $userKeywordMatches=array();
    foreach($keywords as $keyword) {
      if(
        stripos(str_replace(' ','',$user->name),$keyword)!==false
                  ||
        stripos(str_replace(' ','',$user->screen_name),$keyword)!==false
                  ||
        stripos(str_replace(' ','',$user->description),$keyword)!==false
                  ||
        stripos(str_replace(' ','',$user->location),$keyword)!==false
      ) {
        array_push($userKeywordMatches,$keyword);
        $blockReason="their name, bio or location has a blocked keyword match";
      }
    }


    // <if big follower, ignore suspicious and keywords>
      if($user->followers_count>10000) {
        $userKeywordMatches=0;
        $suspiciousUserFlags=0;
      }
    // </if big follower, ignore suspicious and keywords>


    if(!$userKeywordMatches && !$suspiciousUserFlags) {
      file_put_contents(__DIR__.'/approvedCount.txt',file_get_contents(__DIR__.'/approvedCount.txt')+1);
      echo "✅ Approved, adding to approved cache";
      echo "\n";
      array_push($approvedUserIds,$userId);
      file_put_contents(__DIR__.'/approvedUserIdsCache.json',json_encode($approvedUserIds));
      echo "😴 Sleeping for 5 seconds...";
      echo "\n";
      sleep(5);
      continue;
    }

    if($userKeywordMatches) {
      echo "❌ Flagged new follower @".$user->screen_name.", matching on: ".implode(', ',$userKeywordMatches);
      echo "\n";
    }
    if($suspiciousUserFlags && $user->default_profile_image) {
      echo "❌ Flagged new follower @".$user->screen_name.", looks suspect due to no profile image";
      echo "\n";
    }

    if($suspiciousUserFlags && $user->followers_count<10) {
      echo "❌ Flagged new follower @".$user->screen_name.", looks suspect due to low follower count";
      echo "\n";  
    }

    // <blunble>
      echo "❌ Blocking new follower @".$user->screen_name." to make them unfollow";
      echo "\n";

      $response = $connection->post('blocks/create',array(
        'user_id' => $userId
      ));

      echo "😴 Sleeping for 5 seconds...";
      echo "\n";
      sleep(5);

      echo "❌ Unblocking new follower @".$user->screen_name." to make them unfollow";
      echo "\n";

      $response = $connection->post('blocks/destroy',array(
        'user_id' => $userId
      ));
    // </blunble>

    // <mute>
      echo "❌ Muting new follower @".$user->screen_name;
      echo "\n";

      $response = $connection->post('mutes/users/create',array(
        'user_id' => $userId
      ));
    // </mute>

    file_put_contents(__DIR__.'/blockedCount.txt',

      file_get_contents(__DIR__.'/blockedCount.txt')+1

    );

    $followersCount=$followersCount-1;

    echo(
      "🧨 Removed new follower https://twitter.com/".$user->screen_name." because ".$blockReason."\n".
      "Keyword matches: ".implode(', ',$userKeywordMatches)."\n".
      "Follower count: ".$user->followers_count."\n".
      "No profile image: ".$user->default_profile_image."\n".
      "Blocked count :".number_format(file_get_contents(__DIR__.'/blockedCount.txt'))."\n".
      "Approved count :".number_format(file_get_contents(__DIR__.'/approvedCount.txt'))."\n"
    );

  }
?>