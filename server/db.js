require('dotenv').config(); // .env 파일에서 환경 변수를 로드합니다.
const axios = require('axios');
const { response } = require('express');
const { MongoClient } = require("mongodb");
const DDRAGON_VERSION = '14.22.1'; // 최신 버전으로 업데이트 필요
const DDRAGON_LANGUAGE = 'ko_KR'; // 원하는 언어 설정
const { ObjectId } = require('mongodb');  // MongoDB에서 ObjectId 가져오기

// MongoDB 연결 URL을 환경 변수에서 가져옵니다.
const url = process.env.MONGODB_URI;

// MongoDB 클라이언트 인스턴스를 생성합니다.
const client = new MongoClient(url);

// 데이터베이스와 컬렉션 이름을 정의합니다.
const DB_NAME = 'userDB';
const COLLECTION_NAME = 'users';
const POSTS_COLLECTION = 'posts'; // 게시글 컬렉션 추가
const COMMENTS_COLLECTION = 'comments'; // 댓글 컬렉션
const UPDATES_COLLECTION = 'updates'; // 업데이트 컬렉션
const INQUIRIES_COLLECTION = 'inquiries';

// MongoDB에 연결하는 비동기 함수입니다.
async function connectToMongo() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
        return client.db(DB_NAME);
    } catch (error) {
        console.error("Failed to connect to MongoDB", error);
        process.exit(1); // 연결 실패 시 프로세스를 종료합니다.
    }
}

async function fetchUser(userid) {
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    return await collection.findOne({ userid: userid });
}

async function fetchUserByemail(email) {
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    return await collection.findOne({ email: email });
}

async function createUser(newUser) {
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    return await collection.insertOne(newUser);
}

async function removeUser(userid) {
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    const result = await collection.deleteOne({ userid });
    return result.deletedCount > 0;
}

async function createUserprofile(userprofile) {
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    return await collection.updateOne(
        { userid: userprofile.userid }, // `userid`로 문서 찾기
        {
            $set: {
                nickname: userprofile.nickname,
                birthdate: userprofile.birthdate,
                gender: userprofile.gender
            }
        }
    );
}

async function updatePassword(email, hashedPassword) {
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    const result = await collection.updateOne(
        { email: email },
        { $set: { password: hashedPassword } }
    );
    return result;
}

async function closeMongoConnection() {
    await client.close();
    console.log('MongoDB 접속 해제');
}

async function fetchUserProfile(userid) {
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // 해당 사용자 정보 가져오기 (비밀번호 제외)
    return await collection.findOne(
        { userid },
        { projection: { password: 0 } }
    );
}

async function fetchPuuid(summonerName, tag) {
    const apiKey = process.env.RIOT_API_KEY;
    const url = `https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${summonerName}/${tag}?api_key=${apiKey}`;
    try {
        const response = await axios.get(url);
        return response.data.puuid; // Return the `puuid`
    } catch (error) {
        console.error('Failed to fetch puuid', error);
        throw error;
    }
}

// Function to fetch summoner information using `puuid`
async function fetchSummonerIdByPuuid(puuid) {
    const apiKey = process.env.RIOT_API_KEY;
    const url = `https://kr.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}?api_key=${apiKey}`;
    try {
        const response = await axios.get(url);
        return response.data; // Return the summoner data
    } catch (error) {
        console.error('Failed to fetch summoner info by puuid', error);
        throw error;
    }
}

// Function to fetch summoner rank information using `id`
async function fetchSummonerInfoByid(id) {
    const apiKey = process.env.RIOT_API_KEY;
    const url = `https://kr.api.riotgames.com/lol/league/v4/entries/by-summoner/${id}?api_key=${apiKey}`;
    try {
        const response = await axios.get(url);
        return response.data; // Return the summoner rank data
    } catch (error) {
        console.error('Failed to fetch summoner rank info by id', error);
        throw error;
    }
}
// DDragon에서 챔피언 ID와 이름 매핑 생성
async function getChampionIdToNameMap() {
    try {
        const response = await axios.get(`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/data/${DDRAGON_LANGUAGE}/champion.json`);
        const championsData = response.data.data;

        // 챔피언 ID와 이름 매핑 생성
        const championIdToNameMap = {};
        for (const championKey in championsData) {
            const champion = championsData[championKey];
            championIdToNameMap[champion.key] = {
                name: champion.name,
                englishName: champion.id
            };
        }
        return championIdToNameMap;
    } catch (error) {
        console.error('Error fetching champion data from DDragon:', error.message);
        throw error;
    }
}

// 숙련도 높은 5개 챔피언 가져오기
async function getTop5Champions(puuid) {
    const apiKey = process.env.RIOT_API_KEY;
    const url = `https://kr.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}?api_key=${apiKey}`;
    try {
        // 챔피언 마스터리 정보 가져오기
        const response = await axios.get(url);
        const top5Champions = response.data.slice(0, 5);

        // DDragon에서 챔피언 ID와 이름 매핑 생성
        const championIdToNameMap = await getChampionIdToNameMap();

        // 챔피언 ID를 이름과 아이콘 URL로 변환
        const top5ChampionsWithIcons = top5Champions.map(champion => {
            const championData = championIdToNameMap[champion.championId.toString()];
            const iconUrl = `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${championData.englishName}.png`;
            const loadingUrl = `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${championData.englishName}_0.jpg`
            return {
                championName: championData.name,
                masteryPoints: champion.championPoints,
                masteryLevel: champion.championLevel,
                iconUrl: iconUrl,
                loadingUrl: loadingUrl
            };
        });

        return top5ChampionsWithIcons;
    } catch (error) {
        console.error('Error fetching top champions:', error.message);
        throw error;
    }
}


async function createSummoner(summonerprofile) {
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    const puuid = await fetchPuuid(summonerprofile.summonerName, summonerprofile.tag);
    const summonerInfo = await fetchSummonerIdByPuuid(puuid);
    const summonerRankData = await fetchSummonerInfoByid(summonerInfo.id);
    const top5Champions = await getTop5Champions(puuid);
    const summonerRank = Array.isArray(summonerRankData)
        ? [
            ...summonerRankData.filter(entry => entry.queueType === 'RANKED_SOLO_5x5'),
        ]
        : [];

    return await collection.updateOne(
        { userid: summonerprofile.userid },
        {
            $set: {
                summonerInfo,
                summonerRank,
                top5Champions,
                SummonerName: summonerprofile.summonerName,
                Tag: summonerprofile.tag
            }
        }
    );
}

async function ChangeUserprofile(userprofile) {
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    return await collection.updateOne(
        { userid: userprofile.userid }, // `userid`로 문서 찾기
        {
            $set: {
                nickname: userprofile.nickname,
                birthdate: userprofile.birthdate,
                gender: userprofile.gender,
                email: userprofile.email,
            }
        }
    );
}
// 게시글 생성 함수
async function createPost(postData) {
    const db = client.db(DB_NAME);
    const collection = db.collection(POSTS_COLLECTION);
    const newPost = {
        title: postData.title,
        content: postData.content,
        author: postData.author,
        createdAt: new Date(),
        likes: 0, // 추가
        dislikes: 0, // 추가
        views: 0, // 조회수 초기화
        imageUrl: postData.imageUrl || null  // ✅ 이미지 경로 저장
    };
    const result = await collection.insertOne(newPost);
    return { id: result.insertedId, ...newPost };
}

// 게시글 조회 함수(게시판에 모든 게시글을 나열하여 사용자에게 보여주기 위해 필요합니다.)
async function fetchPosts() {
    const db = client.db(DB_NAME);
    const collection = db.collection(POSTS_COLLECTION);
    return await collection.find().sort({ createdAt: -1 }).toArray();
}

// 게시글 삭제 함수 (작성자 확인)
async function deletePost(postId, authorNickname) {
    const db = client.db(DB_NAME);
    const collection = db.collection(POSTS_COLLECTION);
    const result = await collection.deleteOne({ _id: new ObjectId(postId), author: authorNickname });
    return result.deletedCount > 0;
}

// 특정 게시글 조회 함수(특정 게시글에 대한 상세 정보가 필요할 때, 예를 들어 게시글 삭제나 수정 권한을 확인하기 위해 필요합니다.)
async function getPostById(postId) {
    const db = client.db(DB_NAME);
    const collection = db.collection(POSTS_COLLECTION);
    return await collection.findOne({ _id: new ObjectId(postId) });
}

// 게시글 수정 함수
async function updatePost(postId, updatedFields) {
    const db = client.db(DB_NAME);
    const collection = db.collection(POSTS_COLLECTION);

    const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(postId) },
        { $set: updatedFields },
        { returnDocument: 'after' } // 수정 후의 문서를 반환
    );

    return result.value;
}

//좋아요&싫어요 기능 함수
async function updatePostLikes(postId, userId, action) {
    const db = client.db(DB_NAME);
    const collection = db.collection(POSTS_COLLECTION);

    // 게시글 가져오기
    const post = await collection.findOne({ _id: new ObjectId(postId) });
    if (!post) return false;

    const userActions = post.userActions || {}; // 사용자 액션 초기화
    const currentAction = userActions[userId]; // 현재 사용자의 좋아요/싫어요 상태

    // 업데이트 로직
    if (action === currentAction) {
        // 현재 상태와 같은 액션을 다시 누르면 취소
        delete userActions[userId];
        const update = currentAction === 'like' ? { $inc: { likes: -1 } } : { $inc: { dislikes: -1 } };
        await collection.updateOne({ _id: new ObjectId(postId) }, { ...update, $set: { userActions } });
    } else {
        // 상태 변경
        if (currentAction === 'like') {
            await collection.updateOne({ _id: new ObjectId(postId) }, { $inc: { likes: -1 }, $set: { userActions } });
        } else if (currentAction === 'dislike') {
            await collection.updateOne({ _id: new ObjectId(postId) }, { $inc: { dislikes: -1 }, $set: { userActions } });
        }

        userActions[userId] = action;
        const update = action === 'like' ? { $inc: { likes: 1 } } : { $inc: { dislikes: 1 } };
        await collection.updateOne({ _id: new ObjectId(postId) }, { ...update, $set: { userActions } });
    }

    return true;
}

//댓글 추가 함수
async function addComment(postId, comment) {
    const db = client.db(DB_NAME); // 데이터베이스 연결
    const collection = db.collection(COMMENTS_COLLECTION); // 댓글 컬렉션 선택

    const newComment = {
        postId: new ObjectId(postId), // 게시글 ID 참조
        userId: comment.userId,       // 댓글 작성자 ID
        nickname: comment.nickname,   // 댓글 작성자 닉네임
        content: comment.content,     // 댓글 내용
        createdAt: new Date()         // 댓글 작성 시간
    };

    const result = await collection.insertOne(newComment);
    return result.insertedId ? newComment : null; // 삽입된 댓글 반환
}

//댓글 조회 함수
async function getComments(postId) {
    const db = client.db(DB_NAME);
    const collection = db.collection(COMMENTS_COLLECTION);

    return await collection
        .find({ postId: new ObjectId(postId) }) // 게시글 ID로 필터링
        .sort({ createdAt: 1 }) // 작성 시간순 정렬
        .toArray(); // 배열로 반환
}

//댓글 삭제 함수
async function deleteComment(commentId, userId) {
    const db = client.db(DB_NAME);
    const collection = db.collection(COMMENTS_COLLECTION);

    const result = await collection.deleteOne({
        _id: new ObjectId(commentId), // 댓글 ID로 삭제
        userId: userId                // 작성자 확인
    });

    return result.deletedCount > 0; // 삭제 성공 여부 반환
}

// 특정 게시글에 연결된 모든 댓글 삭제 함수
async function deleteCommentsByPostId(postId) {
    const db = client.db(DB_NAME);
    const collection = db.collection(COMMENTS_COLLECTION);

    const result = await collection.deleteMany({ postId: new ObjectId(postId) });
    return result.deletedCount; // 삭제된 댓글 수 반환
}

//댓글 수정 함수
async function updateComment(commentId, userId, newContent) {
    const db = client.db(DB_NAME);
    const collection = db.collection(COMMENTS_COLLECTION);

    const result = await collection.updateOne(
        { _id: new ObjectId(commentId), userId: userId }, // 댓글 ID와 작성자 확인
        { $set: { content: newContent, updatedAt: new Date() } } // 수정된 내용
    );

    return result.modifiedCount > 0; // 수정 성공 여부 반환
}

// 댓글 좋아요/싫어요 처리 함수
async function updateCommentLikes(commentId, userId, action) {
    const db = client.db(DB_NAME);
    const collection = db.collection(COMMENTS_COLLECTION);

    // 댓글 가져오기
    const comment = await collection.findOne({ _id: new ObjectId(commentId) });
    if (!comment) return false;

    const userActions = comment.userActions || {}; // 사용자 액션 초기화
    const currentAction = userActions[userId]; // 현재 사용자의 좋아요/싫어요 상태

    // 업데이트 로직
    if (action === currentAction) {
        // 현재 상태와 같은 액션을 다시 누르면 취소
        delete userActions[userId];
        const update = currentAction === 'like' ? { $inc: { likes: -1 } } : { $inc: { dislikes: -1 } };
        await collection.updateOne({ _id: new ObjectId(commentId) }, { ...update, $set: { userActions } });
    } else {
        // 상태 변경
        if (currentAction === 'like') {
            await collection.updateOne({ _id: new ObjectId(commentId) }, { $inc: { likes: -1 }, $set: { userActions } });
        } else if (currentAction === 'dislike') {
            await collection.updateOne({ _id: new ObjectId(commentId) }, { $inc: { dislikes: -1 }, $set: { userActions } });
        }

        userActions[userId] = action;
        const update = action === 'like' ? { $inc: { likes: 1 } } : { $inc: { dislikes: 1 } };
        await collection.updateOne({ _id: new ObjectId(commentId) }, { ...update, $set: { userActions } });
    }

    return true;
}

// 조회수 증가 함수
async function incrementPostViews(postId) {
    const db = client.db(DB_NAME);
    const collection = db.collection(POSTS_COLLECTION);

    // 게시글의 조회수 1 증가
    const result = await collection.updateOne(
        { _id: new ObjectId(postId) },
        { $inc: { views: 1 } }
    );

    return result.modifiedCount > 0; // 성공 여부 반환
}

// 업데이트 목록 조회 함수
async function fetchUpdates(sortOption = { date: -1 }) {
    const db = client.db(DB_NAME);
    const collection = db.collection(UPDATES_COLLECTION);
    return await collection.find().sort(sortOption).toArray();
}
  
// 업데이트 생성 함수
async function createUpdate(newUpdate) {
    const db = client.db(DB_NAME);
    const collection = db.collection(UPDATES_COLLECTION);
    const result = await collection.insertOne(newUpdate);
    return { _id: result.insertedId, ...newUpdate };
}
  
// 업데이트 ID로 조회 함수
async function fetchUpdateById(id) {
    const db = client.db(DB_NAME);
    const collection = db.collection(UPDATES_COLLECTION);
    return await collection.findOne({ _id: new ObjectId(id) });
}
  
// 업데이트 수정 함수 (date 필드 보존 처리 포함)
async function updateUpdate(id, updatedFields) {
    const db = client.db(DB_NAME);
    const collection = db.collection(UPDATES_COLLECTION);
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updatedFields },
      { returnDocument: 'after' }  // MongoDB Node.js 드라이버 v4.x 이상
    );
  
    // 만약 수정된 문서가 반환되지 않으면 원본 문서를 반환
    if (!result.value) {
      return await fetchUpdateById(id);
    }
  
    // 반환된 문서에 date 필드가 없거나 유효하지 않다면, 원본 문서에서 date 값을 보존
    if (!result.value.date || isNaN(new Date(result.value.date))) {
      const original = await fetchUpdateById(id);
      if (original && original.date) {
        result.value.date = original.date;
      }
    }
    return result.value;
}
  
// 업데이트 삭제 함수
async function deleteUpdate(id) {
    const db = client.db(DB_NAME);
    const collection = db.collection(UPDATES_COLLECTION);
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
}

// 문의 등록
async function createInquiry(inquiryData) {
    const db = client.db(DB_NAME);
    const collection = db.collection(INQUIRIES_COLLECTION);

    const newInquiry = {
        userId: inquiryData.userId,
        name: inquiryData.name,
        title: inquiryData.title,
        content: inquiryData.content,
        answer: null,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const result = await collection.insertOne(newInquiry);
    return { id: result.insertedId, ...newInquiry };
}

// 사용자 ID로 문의 목록 조회
async function getInquiriesByUser(userId) {
    const db = client.db(DB_NAME);
    const collection = db.collection(INQUIRIES_COLLECTION);
    return await collection.find({ userId }).sort({ createdAt: -1 }).toArray();
}

// 전체 문의 목록 조회 (관리자용)
async function getAllInquiries() {
    const db = client.db(DB_NAME);
    const collection = db.collection(INQUIRIES_COLLECTION);
    return await collection.find().sort({ createdAt: -1 }).toArray();
}

// 문의 상세 조회
async function getInquiryById(id) {
    const db = client.db(DB_NAME);
    const collection = db.collection(INQUIRIES_COLLECTION);
    return await collection.findOne({ _id: new ObjectId(id) });
}

// 관리자 답변 등록
async function answerInquiry(id, answerText) {
    const db = client.db(DB_NAME);
    const collection = db.collection(INQUIRIES_COLLECTION);
    const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        {
            $set: {
                answer: answerText,
                status: 'answered',
                updatedAt: new Date(),
            },
        }
    );
    return result.modifiedCount > 0;
}

module.exports = {
    connectToMongo,
    fetchUser,
    createUser,
    removeUser,
    closeMongoConnection,
    createUserprofile,
    createSummoner,
    fetchUserByemail,
    updatePassword,
    createPost,
    fetchPosts,
    deletePost,
    getPostById,
    updatePost,
    updatePostLikes,
    addComment,
    getComments,
    deleteComment,
    updateComment,
    deleteCommentsByPostId,
    updateCommentLikes,
    ChangeUserprofile,
    incrementPostViews,
    fetchUpdates,
    createUpdate,
    fetchUpdateById,
    updateUpdate,
    deleteUpdate,
    createInquiry,
    getInquiriesByUser,
    getAllInquiries,
    getInquiryById,
    answerInquiry,
}